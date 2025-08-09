<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register_form</title>
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
    color: #fff;
  }

  .form {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    background-color: black;
  }
  .form.id{
    background-color: transparent;
  }
  .form.pass{
    background-color: transparent;
  }
  .form.check{
    background-color: transparent;
  }
  .form.email{
    background-color: transparent;
  }
  .form.name{
    background-color: transparent;
  }

  .form .col1 {
    width: 120px;
    color: white;
  }

  .form .col2 input {
    width: 200px;
    padding: 6px;
    background-color: transparent;
    border: 1px solid #555;
    color: black;
  }

  .form.email .col2 input {
    width: 92px;
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
<script>
   function check_input()
   {
      if (!document.member_form.id.value) {
          alert("아이디를 입력하세요!");    
          document.member_form.id.focus();
          return;
      }

      if (!document.member_form.pass.value) {
          alert("비밀번호를 입력하세요!");    
          document.member_form.pass.focus();
          return;
      }

      if (!document.member_form.pass_confirm.value) {
          alert("비밀번호확인을 입력하세요!");    
          document.member_form.pass_confirm.focus();
          return;
      }

      if (!document.member_form.name.value) {
          alert("이름을 입력하세요!");    
          document.member_form.name.focus();
          return;
      }

      if (!document.member_form.email1.value) {
          alert("이메일 주소를 입력하세요!");    
          document.member_form.email1.focus();
          return;
      }

      if (!document.member_form.email2.value) {
          alert("이메일 주소를 입력하세요!");    
          document.member_form.email2.focus();
          return;
      }

      if (document.member_form.pass.value != 
            document.member_form.pass_confirm.value) {
          alert("비밀번호가 일치하지 않습니다.\n다시 입력해 주세요!");
          document.member_form.pass.focus();
          document.member_form.pass.select();
          return;
      }

      document.member_form.submit();
   }

   function reset_form() {
      document.member_form.id.value = "";  
      document.member_form.pass.value = "";
      document.member_form.pass_confirm.value = "";
      document.member_form.name.value = "";
      document.member_form.email1.value = "";
      document.member_form.email2.value = "";
      document.member_form.id.focus();
      return;
   }

   function check_id() {
     window.open("member_check_id.php?id=" + document.member_form.id.value,
         "IDcheck","left=700,top=300,width=350,height=200,scrollbars=no,resizable=yes");
   }
</script>
</head>
<body>
    <header>
        <?php include "../includes/header.php";?>
    </header>

    <section>
        <div id="main_content">
            <div id="join_box">
          	<form  name="member_form" method="post" action="member_insert.php">
			    <h2>REGISTER</h2>
    		    	<div class="form id">
				        <div class="col1">ID</div>
				        <div class="col2">
							    <input type="text" name="id">
				        </div>  
				        <div class="col3">
				        	<a href="#"><img src="/project/img/check_id.gif" 
				        		onclick="check_id()"></a>
				        </div>                 
			       	</div>
			       	<div class="clear"></div>

			       	<div class="form pass">
				        <div class="col1">PASSWORD</div>
				        <div class="col2">
							<input type="password" name="pass">
				        </div>                 
			       	</div>
			       	<div class="clear"></div>
			       	<div class="form check">
				        <div class="col1">PASSWORD CHECK</div>
				        <div class="col2">
							<input type="password" name="pass_confirm">
				        </div>                 
			       	</div>
			       	<div class="clear"></div>
			       	<div class="form name">
				        <div class="col1">USERNAME</div>
				        <div class="col2">
							<input type="text" name="name">
				        </div>                 
			       	</div>
			       	<div class="clear"></div>
			       	<div class="form email">
				        <div class="col1">EMAIL</div>
				        <div class="col2">
							<input type="text" name="email1">@<input type="text" name="email2">
				        </div>                 
			       	</div>
			       	<div class="clear"></div>
			       	<div class="bottom_line"> </div>
			       	<div class="buttons">
	                	<img style="cursor:pointer" src="/project/img/button_save.gif" onclick="check_input()">&nbsp;
                  		<img id="reset_button" style="cursor:pointer" src="/project/img/button_reset.gif"
                  			onclick="reset_form()">
	           		</div>
           	</form>
        	</div> <!-- join_box -->
        </div>
    </section>
</body>
</html>
