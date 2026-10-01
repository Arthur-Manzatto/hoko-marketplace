const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");

const bluePanel = document.getElementById("bluePanel");

const panelLogin = document.getElementById("panelLogin");
const panelRegister = document.getElementById("panelRegister");

const registerButton = document.getElementById("registerButton");
const loginButton = document.getElementById("loginButton");


/*
=====================================================
CONFIGURAÇÃO DA ANIMAÇÃO
=====================================================
*/

const animationTime = "0.7s";
const animationCurve = "cubic-bezier(0.77, 0, 0.18, 1)";


/*
=====================================================
FUNÇÃO QUE ATIVA A TRANSIÇÃO

Ela só é chamada quando o usuário realmente
clicar em um dos botões.
=====================================================
*/

function enableTransitions() {

    const transition =
        `transform ${animationTime} ${animationCurve},
         opacity ${animationTime} ease`;

    loginForm.style.transition = transition;

    registerForm.style.transition = transition;

    bluePanel.style.transition = transition;

    panelLogin.style.transition = transition;

    panelRegister.style.transition = transition;
}


/*
=====================================================
IR PARA CADASTRO
=====================================================
*/

registerButton.addEventListener("click", function () {

    // Primeiro ativamos a animação.
    // Isso NÃO acontece durante o carregamento.

    enableTransitions();


    /*
    ---------------------------------------------
    LOGIN SAI PARA A ESQUERDA
    ---------------------------------------------
    */

    loginForm.style.transform =
        "translateX(-100%)";


    /*
    ---------------------------------------------
    CADASTRO ENTRA PELA DIREITA
    ---------------------------------------------
    */

    registerForm.style.transform =
        "translateX(0)";

    registerForm.style.opacity =
        "1";


    /*
    ---------------------------------------------
    PAINEL AZUL VAI PARA A ESQUERDA
    ---------------------------------------------
    */

    bluePanel.style.transform =
        "translateX(-100%)";


    /*
    ---------------------------------------------
    CONTEÚDO DO PAINEL DE LOGIN
    ---------------------------------------------
    */

    panelLogin.style.opacity =
        "0";

    panelLogin.style.transform =
        "translate(-30px, -50%)";


    /*
    ---------------------------------------------
    DEPOIS QUE O PAINEL COMEÇAR A SAIR,
    TROCAMOS O CONTEÚDO
    ---------------------------------------------
    */

    setTimeout(function () {

        panelLogin.style.display =
            "none";

        panelRegister.style.display =
            "block";

        panelRegister.style.opacity =
            "0";

        panelRegister.style.transform =
            "translate(30px, -50%)";


        /*
        -----------------------------------------
        FORÇA O NAVEGADOR A RECONHECER O ESTADO
        -----------------------------------------
        */

        panelRegister.offsetHeight;


        /*
        -----------------------------------------
        ANIMA O NOVO CONTEÚDO
        -----------------------------------------
        */

        requestAnimationFrame(function () {

            panelRegister.style.opacity =
                "1";

            panelRegister.style.transform =
                "translate(0, -50%)";

        });

    }, 350);

});


/*
=====================================================
VOLTAR PARA LOGIN
=====================================================
*/

loginButton.addEventListener("click", function () {

    // Ativa a transição somente agora

    enableTransitions();


    /*
    ---------------------------------------------
    CADASTRO SAI PARA A DIREITA
    ---------------------------------------------
    */

    registerForm.style.transform =
        "translateX(100%)";

    registerForm.style.opacity =
        "0";


    /*
    ---------------------------------------------
    LOGIN VOLTA PARA A ESQUERDA
    ---------------------------------------------
    */

    loginForm.style.transform =
        "translateX(0)";


    /*
    ---------------------------------------------
    PAINEL AZUL VOLTA PARA A DIREITA
    ---------------------------------------------
    */

    bluePanel.style.transform =
        "translateX(0)";


    /*
    ---------------------------------------------
    CONTEÚDO DO CADASTRO DESAPARECE
    ---------------------------------------------
    */

    panelRegister.style.opacity =
        "0";

    panelRegister.style.transform =
        "translate(30px, -50%)";


    /*
    ---------------------------------------------
    TROCA O CONTEÚDO
    ---------------------------------------------
    */

    setTimeout(function () {

        panelRegister.style.display =
            "none";

        panelLogin.style.display =
            "block";

        panelLogin.style.opacity =
            "0";

        panelLogin.style.transform =
            "translate(-30px, -50%)";


        /*
        -----------------------------------------
        FORÇA REFLUXO
        -----------------------------------------
        */

        panelLogin.offsetHeight;


        /*
        -----------------------------------------
        ANIMA ENTRADA
        -----------------------------------------
        */

        requestAnimationFrame(function () {

            panelLogin.style.opacity =
                "1";

            panelLogin.style.transform =
                "translate(0, -50%)";

        });

    }, 350);

});