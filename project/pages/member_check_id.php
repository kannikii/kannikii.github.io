<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        h3{
            padding-left:5px;
            border-left: solid 5px black;
        }
        #close {
            margin:20px 0 0 80px;
            cursor:pointer;
        }
    </style>
</head>
<body>
<h3>아이디 중복체크</h3>
<p>
    <?php
    $id=$_GET["id"];

    if(!$id){
        echo("<li>아이디를 입력해 주세요!</li>");
    }
    else{
        $con=mysqli_connect("localhost","khlee","hyos8603@@","sample");

        $sql="select * from members where id='$id'";
        $result=mysqli_query($con,$sql);
        $num_record=mysqli_num_rows($result);

        if($num_record){
            echo "<li>".$id."아이디는 중복됩니다.</li>";
            echo"<li>다른 아이디를 사용해 주세요!</li>";
        }
        else{
            echo "<li>".$id."아이디는 사용 가능합니다.</li>";
        }
        mysqli_close($con);
    }
    ?>

</p>
<div id="close">
   <img src="/project/img/close.png" onclick="javascript:self.close()">
</div>
</body>
</html>