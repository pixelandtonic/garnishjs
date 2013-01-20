<?php
/**
 *
 */

require_once('Garnish/Builder.php');
require_once('Garnish/BuildUtils.php');

$args = BuildUtils::parseArgs($argv);
$builder = new Builder($args);
$builder->init();
$builder->run();
