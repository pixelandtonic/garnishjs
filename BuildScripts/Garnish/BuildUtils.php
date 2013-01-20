<?php
/**
 *
 */
class BuildUtils
{
	/**
	 * @static
	 *
	 * @param $path
	 */
	public static function purgeDirectory($path)
	{
		$path = rtrim($path, '/');
		$dirContents = static::dirContents($path);

		foreach ($dirContents as $item)
		{
			if (is_file($item))
			{
				@unlink($item);
			}
			elseif (is_dir($item))
			{
				static::purgeDirectory($item);
				@rmdir($item);
			}
		}
	}

	/**
	 * @static
	 *
	 * @param       $path
	 * @param array $extensions
	 * @return array
	 */
	public static function dirContents($path, $extensions = array())
	{
		$path = rtrim($path, '/');
		$descendants = array();

		if (($contents = @scandir($path.'/')) !== false)
		{
			foreach ($contents as $key => $item)
			{
				$contents[$key] = $path.'/'.$item;
				if (!in_array($item, array(".", "..", ".DS_Store")))
				{
					if (!empty($extensions) && is_file($path.'/'.$item))
					{
						if (in_array(pathinfo($path.'/'.$item, PATHINFO_EXTENSION), $extensions))
						{
							$descendants[] = $contents[$key];
						}
					}

					if (empty($extensions))
					{
						$descendants[] = $contents[$key];
					}

					if (is_dir($contents[$key]))
					{
						$descendants = array_merge($descendants, static::dirContents($contents[$key], $extensions));
					}
				}
			}
		}

		return $descendants;
	}

	/**
	 * @static
	 *
	 * @param $srcDir
	 * @param $zipName
	 *
	 * @return bool
	 * @throws Exception
	 */
	public static function zipDir($srcDir, $zipName)
	{
		$srcDir = rtrim($srcDir, '/');

		if (file_exists($zipName))
		{
			@unlink($zipName);
		}
		else
		{
			if (($handle = fopen($zipName, 'w+')) == false)
			{
				throw new Exception('Couldn’t create the zip file: '.$zipName);
			}
		}

		$zip = new \ZipArchive;
		$zipContents = $zip->open($zipName, \ZipArchive::CREATE);

		if ($zipContents !== TRUE)
		{
			return false;
		}

		$dirContents = static::dirContents($srcDir);

		foreach ($dirContents as $itemToZip)
		{
			if ((file_exists($itemToZip) || is_readable($itemToZip)))// && !is_dir($itemToZip))
			{
				$relFilePath = substr($itemToZip, strlen($srcDir) + 1);

				// If it's an empty dir, we want to add it.
				if (is_dir($itemToZip) && count(scandir($itemToZip)) == 2)
				{
					$zip->addFromString($relFilePath.'/', '');
				}
				elseif (!is_dir($itemToZip))
				{
					// We can't use $zip->addFile() here but it's a terrible, horrible method that's buggy on Windows.
					$fileContents = file_get_contents($itemToZip);
					$zip->addFromString($relFilePath, $fileContents);
				}
			}
		}

		$zip->close();
	}

	/**
	 * @static
	 * @param $srcDir
	 * @param $destDir
	 * @return array
	 */
	public static function copyDirectory($srcDir, $destDir)
	{
		$srcDir = rtrim($srcDir, '/');
		$dirContents = static::dirContents($srcDir);
		$destFiles = array();

		foreach ($dirContents as $item)
		{
			$item = static::normalizePathSeparators($item);
			$itemDest = $destDir.str_replace($srcDir, '', $item);
			if (is_file($item))
			{
				$destFiles[] = $itemDest;
				copy($item, $itemDest);
			}
			elseif (is_dir($item))
			{
				if (!is_dir($itemDest))
				{
					static::createDir($itemDest);
				}
			}
		}

		return $destFiles;
	}

	/**
	 * @static
	 * @param $path
	 * @return array
	 */
	public static function getCompressibleJsFiles($path)
	{
		$contents = file_get_contents($path);
		preg_match('/var\s+scripts\s*=\s*\[\s*(.*?)\s*\]/ms',$contents, $matches);
		$segs = explode(',', $matches[1]);

		for ($counter = 0; $counter < count($segs); $counter++)
		{
			// Remove whitespace, then the extra single quotes.
			$segs[$counter] = trim($segs[$counter]);
			$segs[$counter] = trim($segs[$counter], "'");
		}

		for ($counter = 0; $counter < count($segs); $counter++)
		{
			$segs[$counter] = pathinfo($path, PATHINFO_DIRNAME).'/'.$segs[$counter];
		}

		return $segs;
	}

	/**
	 * @static
	 * @return array|mixed
	 */
	public static function getBenchmarkTime()
	{
		$mtime = microtime();
		$mtime = explode(' ', $mtime);
		$mtime = $mtime[1] + $mtime[0];
		return (int)$mtime;
	}

	/**
	 * @static
	 * @param $argv
	 * @return array
	 */
	public static function parseArgs($argv)
	{
		array_shift($argv);
		$out = array();

		foreach ($argv as $arg)
		{
			if (substr($arg, 0, 2) == '--')
			{
				$eqPos = strpos($arg, '=');

				if ($eqPos === false)
				{
					$key = substr($arg, 2);
					$out[$key] = isset($out[$key]) ? $out[$key] : true;
				}
				else
				{
					$key = substr($arg, 2, $eqPos - 2);
					$out[$key] = substr($arg, $eqPos + 1);
				}
			}
			else if (substr($arg, 0, 1) == '-')
			{
				if (substr($arg, 2, 1) == '=')
				{
					$key = substr($arg, 1, 1);
					$out[$key] = substr($arg, 3);
				}
				else
				{
					$chars = str_split(substr($arg, 1));
					foreach ($chars as $char)
					{
						$key = $char;
						$out[$key] = isset($out[$key]) ? $out[$key] : true;
					}
				}
			}
			else
			{
				$out[] = $arg;
			}
		}

		return $out;
	}

	/**
	 * @param     $directory
	 * @param int $permissions
	 * @return bool
	 */
	public static function createDir($directory, $permissions = 0754)
	{
		$oldumask = umask(0);
		if (mkdir($directory, $permissions, true))
		{
			chmod($directory, $permissions);
			umask($oldumask);
			return true;
		}

		return false;
	}

	/**
	 *
	 */
	public static function isWindows()
	{
		if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN')
		{
			return true;
		}

		return false;
	}

	/**
	 * Returns the files found under the specified directory and subdirectories.
	 * @param string $dir the directory under which the files will be looked for
	 * @param array $options options for file searching. Valid options are:
	 * <ul>
	 * <li>fileTypes: array, list of file name suffix (without dot). Only files with these suffixes will be returned.</li>
	 * <li>exclude: array, list of directory and file exclusions. Each exclusion can be either a name or a path.
	 * If a file or directory name or path matches the exclusion, it will not be copied. For example, an exclusion of
	 * '.svn' will exclude all files and directories whose name is '.svn'. And an exclusion of '/a/b' will exclude
	 * file or directory '$src/a/b'. Note, that '/' should be used as separator regardless of the value of the DIRECTORY_SEPARATOR constant.
	 * </li>
	 * <li>level: integer, recursion depth, default=-1.
	 * Level -1 means searching for all directories and files under the directory;
	 * Level 0 means searching for only the files DIRECTLY under the directory;
	 * level N means searching for those directories that are within N levels.
	 * </li>
	 * </ul>
	 * @return array files found under the directory. The file list is sorted.
	 */
	public static function findFiles($dir, $options = array())
	{
		$fileTypes = array();
		$exclude = array();
		$level = -1;
		extract($options);

		$list = static::findFilesRecursive($dir, '', $fileTypes, $exclude, $level);

		sort($list);
		return $list;
	}

	/**
	 * @param $path
	 * @param $permissions
	 * @return bool
	 */
	public static function changePermissions($path, $permissions = 754)
	{
		if (file_exists($path))
		{
			// '755' normalizes to octal '0755'
			$permissions = octdec(str_pad($permissions, 4, '0', STR_PAD_LEFT));

			if (chmod($path, $permissions))
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the files found under the specified directory and subdirectories.
	 * This method is mainly used by {@link findFiles}.
	 * @param string $dir the source directory
	 * @param string $base the path relative to the original source directory
	 * @param array $fileTypes list of file name suffix (without dot). Only files with these suffixes will be returned.
	 * @param array $exclude list of directory and file exclusions. Each exclusion can be either a name or a path.
	 * If a file or directory name or path matches the exclusion, it will not be copied. For example, an exclusion of
	 * '.svn' will exclude all files and directories whose name is '.svn'. And an exclusion of '/a/b' will exclude
	 * file or directory '$src/a/b'. Note, that '/' should be used as separator regardless of the value of the DIRECTORY_SEPARATOR constant.
	 * @param integer $level recursion depth. It defaults to -1.
	 * Level -1 means searching for all directories and files under the directory;
	 * Level 0 means searching for only the files DIRECTLY under the directory;
	 * level N means searching for those directories that are within N levels.
	 * @return array files found under the directory.
	 */
	protected static function findFilesRecursive($dir, $base, $fileTypes, $exclude, $level)
	{
		$list = array();
		$handle = opendir($dir);

		while (($file = readdir($handle)) !== false)
		{
			if ($file === '.' || $file === '..')
			{
				continue;
			}

			$path = $dir.DIRECTORY_SEPARATOR.$file;
			$isFile = is_file($path);

			if (static::validatePath($base, $file, $isFile, $fileTypes, $exclude))
			{
				if ($isFile)
				{
					$list[] = $path;
				}
				else if($level)
				{
					$list = array_merge($list, static::findFilesRecursive($path, $base.'/'.$file, $fileTypes, $exclude, $level - 1));
				}
			}
		}

		closedir($handle);
		return $list;
	}

	/**
	 * Validates a file or directory.
	 * @param string $base the path relative to the original source directory
	 * @param string $file the file or directory name
	 * @param boolean $isFile whether this is a file
	 * @param array $fileTypes list of file name suffix (without dot). Only files with these suffixes will be copied.
	 * @param array $exclude list of directory and file exclusions. Each exclusion can be either a name or a path.
	 * If a file or directory name or path matches the exclusion, it will not be copied. For example, an exclusion of
	 * '.svn' will exclude all files and directories whose name is '.svn'. And an exclusion of '/a/b' will exclude
	 * file or directory '$src/a/b'. Note, that '/' should be used as separator regardless of the value of the DIRECTORY_SEPARATOR constant.
	 * @return boolean whether the file or directory is valid
	 */
	protected static function validatePath($base, $file, $isFile, $fileTypes, $exclude)
	{
		foreach ($exclude as $e)
		{
			if ($file === $e || strpos($base.'/'.$file, $e) === 0)
			{
				return false;
			}
		}

		if (!$isFile || empty($fileTypes))
		{
			return true;
		}

		if (($type = pathinfo($file, PATHINFO_EXTENSION)) !== '')
		{
			return in_array($type, $fileTypes);
		}
		else
		{
			return false;
		}
	}

	/**
	 * @param $path
	 */
	public static function createFile($path)
	{
		$path = static::normalizePathSeparators($path);

		$handle = fopen($path, 'w');
		fclose($handle);
	}

	/**
	 * Will take a given path and normalize it to use single forward slashes for path separators.  If it is a folder, it will append a trailing forward slash to the end of the path.
	 *
	 * @static
	 * @param  string $path The path to normalize.
	 * @return string The normalized path.
	 */
	public static function normalizePathSeparators($path)
	{
		$path = str_replace('\\', '/', $path);
		$path = str_replace('//', '/', $path);

		// Use is_dir here to prevent an endless recursive loop
		if (is_dir($path))
			$path = rtrim($path, '/').'/';

		return $path;
	}
}
