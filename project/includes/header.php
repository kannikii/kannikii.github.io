<?php
session_start(); // 로그인 상태 확인을 위해 필요
?>
<header>
<div class="container">
     <h1>
        <a href="/project/index.php" class="btn" data-animation-scroll="true" data-target="#main">LEE</a>
      </h1>
      <nav>
        <ul>
          <li>
            <button data-animation-scroll="true" data-target="#about">About</button>
          </li>
          <li>
            <button data-animation-scroll="true" data-target="#features">Features</button>
          </li>
          <li>
            <button data-animation-scroll="true" data-target="#portfolio">Portfolio</button>
          </li>
          <li>
            <button data-animation-scroll="true" data-target="#contact">Contact</button>
          </li>
          <?php if(isset($_SESSION['userid'])): ?>
            <li><a href="/project/pages/board_list.php">Posts</a></li>
            <li><a href="/project/pages/message_form.php">Message</a></li>
            <li><a href="/project/pages/logout.php">LogOut</a></li>
          <?php else: ?>
            <li><a href="/project/pages/login_form.php">Login</a></li>
            <li><a href="/project/pages/register_form.php">Register</a></li>
          <?php endif; ?>
        </ul>
      </nav>
    </div>

</header>

