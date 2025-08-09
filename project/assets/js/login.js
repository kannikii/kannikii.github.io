function check_input(){
    // 더 안전한 방법으로 폼 요소에 접근
    const form = document.forms['login_form'] || document.querySelector('form[name="login_form"]');
    
    if (!form) {
        alert("폼을 찾을 수 없습니다.");
        return;
    }
    
    const idInput = form.elements['id'] || form.querySelector('input[name="id"]');
    const passInput = form.elements['pass'] || form.querySelector('input[name="pass"]');
    
    if(!idInput || !idInput.value.trim()){
        alert("아이디를 입력하세요");
        if(idInput) idInput.focus();
        return;
    }
    
    if(!passInput || !passInput.value.trim()){
        alert("비밀번호를 입력하세요");
        if(passInput) passInput.focus();
        return;
    }
    
    form.submit();
}