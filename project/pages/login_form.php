<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login_form</title>
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
  }

  .form .col1 {
    width: 120px;
    color: white;
  }
  .form.id{
    background-color:transparent;
  }

  .form .col2 input {
    width: 200px;
    padding: 6px;
    background-color: transparent;
    border: 1px solid #555;
    color: black;
  }

  .form.email .col2 input {
    width: 90px;
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

  #login_btn{
    background-color:transparent;
    text-align: center;
  }

  #login_btn img {
    width: 30px;   /* 버튼 가로크기 */
    height: auto;   /* 비율 유지 */
    border-radius: 20px; /* 살짝 둥글게 */
    transition: opacity 0.2s ease;
    background-color:white;
    }

#login_btn img:hover {
    opacity: 0.85;  /* 호버 시 살짝 어둡게 */
}
  
</style>
</head>
<body>
    <header>
        <?php include "../includes/header.php";?>
    </header>

    <section>
        <div id="main_content">
            <div id="login_box">
                <form id="login_form" action="login.php" method="post" name="login_form">
                    <h2>LOGIN</h2>
                    <div class="form id">
                        <div class="col1">ID</div>
                         <div class="col2">
							    <input type="text" name="id">
				        </div>  
                    </div>
                    <div class="form pass">
                        <div class="col1">PASSWORD</div>
				        <div class="col2">
							<input type="password" name="pass">
                        </div>
                    </div>
                    <div id="login_btn">
                      	<a href="#"><img src="/project/img/arrow-right.png" onclick="check_input()"></a>
                  	</div>
                </form>
            </div>
        </div>
    </section>
    <script type="text/javascript">
    // DOM이 완전히 로드된 후 실행되도록 보장
    document.addEventListener('DOMContentLoaded', function() {
        // 여기서 추가 초기화가 필요하면 수행
    });</script>
    <script type="text/javascript" src="/project/assets/js/login.js"></script>
</body>
</html>
