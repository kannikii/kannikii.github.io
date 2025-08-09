<?php
session_start();

if (!isset($_SESSION['userid']) || empty($_SESSION['userid'])) {
    echo "<script>
            alert('로그인한 사람만 작성할 수 있습니다.');
            location.href = '/project/index.php';
          </script>";
    exit;
}
?>
