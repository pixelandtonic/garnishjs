<?php

/**
 *
 */
class Builder
{
	protected $_sourceDir;
	protected $_buildScriptDir;
	protected $_buildDir;
	protected $_uncompressedFileName;
	protected $_compressedFileName;
	protected $_uncompressedFile;
	protected $_compressedFile;
	protected $_repoPath;
	protected $_startTime;
	protected $_isWindows;

	private $_version = '0.1';

	/**
	 * @param $args
	 * @throws Exception
	 */
	public function __construct($args)
	{
		$this->_startTime = BuildUtils::getBenchmarkTime();
		$this->_isWindows = BuildUtils::isWindows();
		date_default_timezone_set('UTC');

		$this->_repoPath = getenv('GITREPO_PATH');

		if (!$this->_repoPath)
		{
			throw new Exception('Could not find the GITREPO_PATH environment variable.');
		}

		$this->_repoPath = rtrim(str_replace('\\', '/', $this->_repoPath), '/').'/';
	}

	/**
	 *
	 */
	public function init()
	{
		$projectRoot = realpath(dirname(__FILE__)).'/../../';

		$this->_sourceDir      = str_replace('\\', '/', realpath($projectRoot.'Source').'/');
		$this->_buildScriptDir = str_replace('\\', '/', realpath($projectRoot.'BuildScripts').'/');
		$this->_buildDir       = str_replace('\\', '/', realpath($projectRoot.'Build').'/');

		$this->_uncompressedFileName = 'garnish-'.$this->_version.'.js';
		$this->_compressedFileName = 'garnish-'.$this->_version.'.min.js';

		$this->_uncompressedFile = $this->_buildDir.$this->_uncompressedFileName;
		$this->_compressedFile = $this->_buildDir.$this->_compressedFileName;
	}

	/**
	 *
	 */
	public function run()
	{
		$this->prepBuildDir();

		$this->yuiCompressify();
		$this->copyGarnishFiles();

		$totalTime = BuildUtils::getBenchmarkTime() - $this->_startTime;
		echo PHP_EOL.'Execution Time: '.$totalTime.' seconds.'.PHP_EOL;
	}

	/**
	 *
	 */
	protected function prepBuildDir()
	{
		if (!file_exists($this->_buildDir))
		{
			BuildUtils::createDir($this->_buildDir, 0755);
		}
		else
		{
			BuildUtils::changePermissions($this->_buildDir, 755);
		}
	}

	/**
	 *
	 */
	protected function yuiCompressify()
	{
		echo "Merging all of the JS files into {$this->_uncompressedFile}...".PHP_EOL;

		// Assemble a list of all the JS files
		$jsFiles = array(
			$this->_sourceDir.'Base.js',
			$this->_sourceDir.'garnish.js',
		);
		$jsClassFiles = glob($this->_sourceDir.'classes/*.js');
		$jsFiles = array_merge($jsFiles, $jsClassFiles);

		// Assempble the build file contents
		$contents = <<<HEADER
/*!
 * Garnish UI toolkit
 *
 * @copyright 2013 Pixel & Tonic, Inc.. All rights reserved.
 * @author    Brandon Kelly <brandon@pixelandtonic.com>
 * @version   {$this->_version}
 */
(function($){


HEADER;

		// Add each of the JS file contents
		foreach ($jsFiles as $jsFile)
		{
			$contents .= file_get_contents($jsFile)."\n\n";
		}

		// Add the footer
		$contents .= "})(jQuery);\n";

		// Save out the uncompressed file
		file_put_contents($this->_uncompressedFile, $contents);

		echo "Finished merging all of the JS files into {$this->_uncompressedFile}".PHP_EOL.PHP_EOL;

		// Compress it
		echo "Compressing {$this->_uncompressedFile} into {$this->_compressedFile}...".PHP_EOL;

		$yuiCompressorFile = $this->_buildScriptDir . 'lib/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar';
		$command = "java -jar {$yuiCompressorFile} --charset utf-8 --type js {$this->_uncompressedFile} > {$this->_compressedFile}";
		echo "Executing: {$command}".PHP_EOL;
		exec("{$command} 2>&1", $output, $status);
		echo "Status: {$status}".PHP_EOL;
		$output = implode(PHP_EOL, $output);
		echo "Results: {$output}".PHP_EOL;

		if ($status !== 0)
		{
			throw new Exception('Could not YuiCompressify a file: '.$jsFile);
		}

		echo "Finished compressing {$this->_uncompressedFile} into {$this->_compressedFile}".PHP_EOL.PHP_EOL;
	}

	/**
	 *
	 */
	protected function copyGarnishFiles()
	{
		echo ('Copying Garnish files into other repos...'.PHP_EOL.PHP_EOL);

		$targetPaths = array(
			$this->_repoPath.'assets/Source/themes/third_party/assets/lib/',
			$this->_repoPath.'assets/Build/Assets/themes/third_party/assets/lib/',
			$this->_repoPath.'Craft/Source/Web/craft/app/resources/lib/',
		);

		$garnishFileNames = array($this->_uncompressedFileName, $this->_compressedFileName);

		foreach ($targetPaths as $targetPath)
		{
			foreach ($garnishFileNames as $garnishFileName)
			{
				$sourceFile = $this->_buildDir . $garnishFileName;
				$targetFile = $targetPath . $garnishFileName;

				echo ('Copying file from '.$sourceFile.' to '.$targetFile.PHP_EOL);
				copy($sourceFile, $targetFile);
				echo ('Finished copying file from '.$sourceFile.' to '.$targetFile.PHP_EOL);
			}
		}

		echo (PHP_EOL.'Finished copying Garnish files into other repos.'.PHP_EOL.PHP_EOL);
	}

	/**
	 * @param $newContents
	 * @param $oldContents
	 * @param $file
	 */
	private function _saveContents($newContents, $oldContents, $file)
	{
		if ($newContents != $oldContents)
		{
			echo ('Saving... ');
			file_put_contents($file, $newContents);
			echo ('Done.');
		}
		else
		{
			echo ('No changes.');
		}
	}

	/**
	 * @param $path
	 * @return bool
	 */
	private function _excludePathSegments($path)
	{
		$pass = true;
		//$path = str_replace('\\', '/', $path);

		//if (strpos($path, '/framework/') !== false)
		//{
		//	$pass = false;
		//}

		return $pass;
	}
}
