
<!DOCTYPE html>
<html lang="zxx">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Project</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

  <link rel="stylesheet" href="style.css">
  
</head>
<body>
    <?php include("includes/header.php"); ?>
 
  
  <main id="main">
    <div class="container">
      <h4>Welcome</h4>
      <h2> <span></span></h2>
      <p> 미완성 사이트</p>
      <button class="download" onclick="location.href='/project/pages/board_form.php'">WRITE</button>
      <button class="mouse"><i class="fa-solid fa-computer-mouse"></i></button>
    </div>
  </main>
  <!-- end main -->
   <section id="about" class="about">
      <div class="container">
        <div class="title">
          <h4>Who Am I</h4>
          <h2>About Me</h2>
        </div>
        <div class="about-self">
          <div class="left">
            <img src="/project/images/blackwave.jpeg" alt="bg">
          </div>
          <div class="right">
            <h3>Hello, <Strong>I'm Lee</Strong></h3>
            <p>I'm ~~~</p>

            <div class="social">
              <a href="https://www.facebook.com/rad.rad.545/" target="_blank">
                <i class="fa-brands fa-facebook"></i>
              </a>
              <a href="https://www.instagram.com/kannikii/" target="_blank">
                <i class="fa-brands fa-instagram"></i>
              </a>
              <a href="https://www.github.com/kannikii/" target="_blank">
                <i class="fa-brands fa-github"></i>
              </a>
              <a href="https://www.youtube.com/@kannikii" target="_blank">
                <i class="fa-brands fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
   </section>
   <section id="features">
    <div class="container">
      <div class="title">
        <h4>Features</h4>
        <h2>What I do</h2>
      </div>
      
      <div class="do-me">
        <div class="do-inner">
          <div class="icon">
            <i class="fa-brands fa-html5"></i>
          </div>
          <div class="content">
            <h3>C++</h3>
            <p>Lorem ipsum dolor sit amt</p>
          </div>
        </div>

        <div class="do-inner">
          <div class="icon">
            <i class="fa-brands fa-html5"></i>
          </div>
          <div class="content">
            <h3>C++</h3>
            <p>Lorem ipsum dolor sit amt</p>
          </div>
        </div>

        <div class="do-inner">
          <div class="icon">
            <i class="fa-brands fa-html5"></i>
          </div>
          <div class="content">
            <h3>C++</h3>
            <p>Lorem ipsum dolor sit amt</p>
          </div>
        </div>

      </div>
      <div class="bg"></div>
    </div>
   </section>
   <section id="portfolio" class="portfolio">
    <div class="container">
      <div class="title">
        <h4>PORTFOLIOBACK</h4>
        <h2>PortFolio</h2>
      </div>
      <div class="portfolio-me">
        <div class="portfolio-inner">
          <img src="images/mock1.png" alt="sample">
          <strong>BRANDING</strong>
          <h3>Package Design</h3>
        </div>

        <div class="portfolio-inner">
          <img src="images/mock2.png" alt="sample">
          <strong>BRANDING</strong>
          <h3>Package Design</h3>
        </div>

        <div class="portfolio-inner">
          <img src="images/mock3.png" alt="sample">
          <strong>BRANDING</strong>
          <h3>Package Design</h3>
        </div>

        <div class="portfolio-inner">
          <img src="images/mock4.png" alt="sample">
          <strong>BRANDING</strong>
          <h3>Package Design</h3>
        </div>

        <div class="portfolio-inner">
          <img src="images/mock5.png" alt="sample">
          <strong>BRANDING</strong>
          <h3>Package Design</h3>
        </div>

        <div class="portfolio-inner">
          <img src="images/mock6.png" alt="sample">
          <strong>BRANDING</strong>
          <h3>Package Design</h3>
        </div>

      </div>
    </div>
   </section>
   <section id="contact" class="contact">
    <div class="container">
      <div class="title">
        <h4>CONTACT</h4>
        <h2>Contact Info</h2>
      </div>
      <div>
        <div class="contact-me">
          <div class="left">
            <div class="card">

              <div class="icon">
                <i class="fa-solid fa-phone-volume"></i>
              </div>
              <div class="info-text">
                <h3>phone</h3>
                <p>010-4222-8888</p>
              </div>
            </div>
            <div class="card">
              <div class="icon">
                <i class="fa-solid fa-envelope-open-text"></i>
              </div>
              <div class="info-text">
                <h3>email</h3>
                <p>kwnnh0124@dgu.ac.kr</p>
              </div>
            </div>
            <div class="card">
              <div class="icon">
                <i class="fa-solid fa-location-crosshairs"></i>
              </div>
              <div class="info-text">
                <h3>address</h3>
                <p>Seoul, Republic of Korea</p>
              </div>
            </div>
          </div>
          

          <div class="right">
            <form action="#">
              <div class="form-group">
                <label for="name">name</label>
                <input type="text" id="name">
              </div>

              <div class="form-group">
                <label for="email">email</label>
                <input type="text" id="email">
              </div>

              <div class="form-group">
                <label for="msg">message</label>
                <textarea name="msg" id="msg"></textarea>
              </div>
              <button type="submit">send</button>
            </form>

          </div>
        </div>
      </div>
    </div>
  </div>


   </section>
  <!-- script 태그는 수정하지 않습니다. -->
  <script src="script.js"></script>
</body>
</html>