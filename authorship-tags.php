<?php
   /*
   Plugin Name: Authorship-tags
   Plugin URI: http://api.wordpress.tags.authorship.me
   Description: The plugin generates tags from your posts!
   Version: 1.0
   Author: Authorship-Thaigo Rodrigues and Luis Bajana
   License: GPL2
  */
  defined( 'ABSPATH' ) or die( 'No script kiddies please!' );   
  define( 'AUTHOSHIP-TAGS_VERSION', '1.0' );   
  
  add_action( 'wp_loaded', 'add_scripts' );
  add_action( 'wp_loaded', 'add_styles' );
  
  function add_scripts() {
    wp_register_script( 'tags-scripts-jquery', plugins_url('/js/jquery-3.0.0.min.js', __FILE__ ) , array('jquery'),'3.0');
    wp_enqueue_script( 'tags-scripts-jquery');
    wp_register_script( 'tags-scripts-tagApi', plugins_url( 'js/tagsApi.js', __FILE__ ) );
    wp_enqueue_script( 'tags-scripts-tagApi');
    wp_register_script( 'tags-scripts-main', plugins_url( '/js/main.js', __FILE__ ), array('tags-scripts-jquery'));
    wp_enqueue_script( 'tags-scripts-main');
  }
   
  function add_styles() {
    wp_register_style( 'tags-styles-main',  plugins_url( '/css/authorship.min.css', __FILE__ ));
    wp_enqueue_style( 'tags-styles-main');
  }
   
   echo "<p id='imageAddress'>" . plugins_url( '/img/authorship_loading.gif', __FILE__ ) . "</p>";
   
?>

 
