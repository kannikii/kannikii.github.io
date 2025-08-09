<?php include "../pages/check_login.php"; ?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>write content</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    <link rel="stylesheet" href="/project/style.css">
    <style>
  body {
    background-color: #000;
    color: #eee;
    font-family: Arial, sans-serif;
  }

  #main_content {
    width: 500px;
    margin: 50px auto;
    padding: 30px;
    background-color: #111;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(255,255,255,0.1);
  }

  #main_content h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #000;
  }

  .form {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
 
  .form.username{
    background-color: transparent;
  }
  .form.title{
    background-color: transparent;
  }

  .form .col1 {
    width: 120px;
    color: black;
  }

  .form .col2 input {
    width: 300px;
    padding: 6px;
    background-color: transparent;
    border: 1px solid #555;
    color: black;
  }
  .form .col2 textarea{
    width: 300px;
    height: 300px;
    border: 1px solid #555;
    color: black;
  }

  .form h2{
    color: #000;
    background-color: transparent;
  }
  

  .col3 img {
    vertical-align: middle;
  }

  .bottom_line {
    border-top: 1px solid #333;
    margin: 20px 0;
  }

  .buttons {
    text-align: center;
  }

  .buttons img {
    cursor: pointer;
  }

  .clear {
    clear: both;
  }
  
</style>
</head>
<body>
    <header>
        <?php include "../includes/header.php";?>
    </header>
    <section>
        <div id="main_content">
        <div id="board_box">
            <h3 id="board_title">
                WRITE
            </h3>
            <form name="board_form" method="post" action="board_insert.php" enctype="multipart/form-data">
                <h2>CONTENTS</h2>
                <div class="form username">
				        <div class="col1">USERNAME : </div>
				        <div class="col2"><?=$username?></div>  
			    </div>
			       	<div class="clear"></div>

			    <div class="form title">
				        <div class="col1">TITLE : </div>
				        <div class="col2">
							<input type="text" name="subject">
				        </div>                 
			    </div>
			       	<div class="clear"></div>
			       	<div class="form content">
				        <div class="col1">CONTENTS : </div>
				        <div class="col2">
							<textarea name="content" id="content"></textarea>
				        </div>                 
			       	</div>
			       	<div class="clear"></div>
			       	
			       	<div class="clear"></div>
			       	<div class="bottom_line"> </div>
			       	<div class="buttons">
	                	<img style="cursor:pointer" src="/project/img/button_save.gif" onclick="check_input()">&nbsp;
                  		<img id="reset_button" style="cursor:pointer" src="/project/img/button_reset.gif"
                  			onclick="reset_form()">
	           		</div>
            </form>
        </div>
        </div>
    </section>
</body>
</html>
