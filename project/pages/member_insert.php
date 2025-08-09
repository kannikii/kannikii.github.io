<?php
    $id=$_POST["id"];
    $pass=$_POST["pass"];
    $name=$_POST["name"];
    $email1=$_POST["email1"];
    $email2=$_POST["email2"];

    $email=$email1."@".$email2;
    $regist_day=date("Y-m-d (H:i)");

    $con = mysqli_connect("localhost","khlee","hyos8603@@","sample");

    $sql="insert into members(id, pass, name,email, regist_day,level,point)";
    $sql .="values('$id','$pass','$name','$email','$regist_day',9,0)";

    mysqli_query($con,$sql);
    mysqli_close($con);

    echo    "
    <script>
        alert('가입성공! 메인페이지로 이동합니다.');
    </script>
    ";

    echo "
        <script>
            location.href='/project/index.php';
        </script>
    ";
?>
