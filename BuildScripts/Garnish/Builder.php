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

		$this->_uncompressedFile = $this->_buildDir.'garnish-'.$this->_uncompressedFileName;
		$this->_compressedFile = $this->_buildDir.'garnish-'.$this->_compressedFileName;
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
		$jsFiles = glob($this->_sourceDir."*.js");

		// Compress and merge into garnish.js
		echo ('Compressing and merging JS files into '.$this->_compressedFile.PHP_EOL);

		$header = <<<HEADER
/*!
 * Garnish UI toolkit
 *
 * @copyright 2013 Pixel & Tonic, Inc.. All rights reserved.
 * @author    Brandon Kelly <brandon@pixelandtonic.com>
 * @version   {$this->_version}
 */
(function($){
HEADER;

		$uncompressedContents = $header."\n\n\n";

		file_put_contents($this->_uncompressedFile, $uncompressedContents);
		file_put_contents($this->_compressedFile, $uncompressedContents);

		$counter = 0;

		// Make sure garnish.js is at the top of the list.
		$sourceGarnishJsPath = $this->_sourceDir.'garnish.js';
		$key = array_search($sourceGarnishJsPath, $jsFiles);
		unset($jsFiles[$key]);
		array_unshift($jsFiles, $sourceGarnishJsPath);

		foreach ($jsFiles as $jsFile)
		{
			$fileName = pathinfo($jsFile, PATHINFO_FILENAME);

			$command = "java -jar {$this->_buildScriptDir}lib/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar --charset utf-8 --type js {$jsFile} >> {$this->_compressedFile}";

			echo ('Executing: '.$command.PHP_EOL);

			exec($command.' 2>&1', $output, $status);
			echo 'Status: '.$status.PHP_EOL;
			$output = implode(PHP_EOL, $output);
			echo 'Results: '.$output.PHP_EOL.PHP_EOL;

			if ($status !== 0)
			{
				throw new Exception('Could not YuiCompressify a file: '.$jsFile);
			}

			$uncompressedContents .= file_get_contents($jsFile)."\n\n";

			$counter++;
		}

		// Add the footer
		$footer = "})(jQuery);\n";

		$compressedContents = file_get_contents($this->_compressedFile) . $footer;
		$uncompressedContents .= $footer;

		file_put_contents($this->_compressedFile, $compressedContents);
		file_put_contents($this->_uncompressedFile, $uncompressedContents);

		echo ('Finished compressing and merging JS files into '.$this->_buildScriptDir.PHP_EOL.PHP_EOL);
	}

	/**
	 *
	 */
	protected function copyGarnishFiles()
	{
		echo ('Copying Garnish files into other repos...'.PHP_EOL.PHP_EOL);

		$targetPaths = array(
			$this->_repoPath.'assets/Source/themes/third_party/assets/lib/',
			$this->_repoPath.'Blocks/Source/Core/blocks/app/resources/lib/',
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
