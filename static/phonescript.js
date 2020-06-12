var lastState = "0";  //Lo stato precedente, 1 se si è in una sessione di gioco
var bar;  //La barra del countdown
var answers;  //Il div contenente le 4 risposte
var results;  //Il div contenente i risultati

//init è la funzione che viene chiamata una volta finito il caricamento della pagina
window.onload = init;
function init() {
  //vengono messe nelle variabili gli elementi con i rispettivi id
  bar = document.getElementById('barra')
  answers = document.getElementById("displayAnswers")
  results = document.getElementById('displayResults')
  answers.style.display = "none"; //Vengono nascosti i risultati
}

var puller = setInterval(() => {
  //viene creato un timer (puller) che controlla la sessione di gioco all'URL /gameState
  loadData("/gameState", (x) => {
    if (x == "1" && lastState == "0") {
      //se lo stato cambia da 0 a 1 vengono caricate le opzioni
      loadOptions();
    }
    lastState = x;
  })
}, 1000)

function loadOptions() {
  document.body.style.backgroundColor = "white";  //sfondo bianco
  answers.style.display = "block";  //mostrate le opzioni di riposta
  results.style.display = "none";   //nascosti i risultati
  var timer;
  loadData("/secondTimer", (x) => {
    //Viene caricato il timer per la domanda (vedi main.js)
    timer = parseInt(x, 10)
    timer += 1000;  //Ci viene aggiunto un secondo perché non si sa mai
    var w = 100;
    var int = setInterval(() => {
      //Ogni centesimo del timer viene diminuito dell'1% la larghezza della barra
      w -= 1;
      bar.style.width = w + "%";
    }, Math.round(timer / 100))
    setTimeout(() => {
      //Alla fine del countdown:
      clearInterval(int); //viene tolto il timer della barra
      loadResults();      //vengono caricati i risultati
    }, timer)
  })
}

function loadResults() {
  answers.style.display = "none";   //nascoste le opzioni di risposta
  results.style.display = "block";  //mostrati i risultati
  //viene prelevato il numero di squadra dall'url (/phone/1) e viene usato per prendere le informazioni
  var url = window.location.href
  url = url.substr(url.length - 1, url.length); //l'ultimo carattere
  url = parseInt(url, 10) - 1;  //ci si toglie uno perché gli indici partono da 0
  loadData("/answPhone/" + url, (x) => {
    if (x == "Nessuna risposta :(") {
      //se non è data risposta
      x = "";
    }
    document.getElementById('data').innerHTML = x;  //il div di id "data" viene impostato alla risposta data
  })
  loadData("/guadagnoPhone/" + url, (x) => {
    var guad = parseInt(x, 10);
    if (guad > 0) {
      //se c'è un guadagno
      document.getElementById('esito').innerHTML = "Esatto!";
      document.body.style.backgroundColor = "green";  //sfondo verde
    } else {
      //se non c'è un guadagno (0 punti)
      document.getElementById('esito').innerHTML = "Sbagliato :(";
      document.body.style.backgroundColor = "red";    //sfondo rosso
    }
    loadData("/punteggioPhone/" + url, (x) => {
      //viene caricato anche il punteggio e messo come punteggio(+guadagno)
      document.getElementById('punteggio').innerHTML = x + "(+" + guad + ")";
    })
  })
}

function wait() {
  //nel caso di risposta si aspetta
  answers.style.display = "none";
  results.style.display = "block";  //ho usato il div dei risultati perché sono pigro
  document.getElementById('esito').innerHTML = "Attendi...";  //ho riusato questo div per scriverci attendi sì
  document.getElementById('data').innerHTML = ""    //niente risposta data
  document.getElementById('punteggio').innerHTML = "" //nessun punteggio
}

function sendResponse(rsp) {
  //questa funzione viene chiamata alla pressione di ogni tasto nell'HTML
  var tm = window.location.href
  tm = tm.substr(tm.length - 1, tm.length); //si carica il numero di squadra dall'url
  //dato che sono stupido ho chiamato la funzione dall'HTML con dei numeri,
  //qui vengono convertiti nelle rispettive lettere
  switch (rsp) {
    case 1:
    rsp = "A";
    break;
    case 2:
    rsp = "B";
    break;
    case 3:
    rsp = "C";
    break;
    case 4:
    rsp = "D";
    break;
    default:
    rsp = "";
  }
  //viene mandata una richiesta GET con i parametri di squadra e risposta,
  //si lo so di solito si usa il protocollo POST per cose come questa, erano le 2 di notte
  loadData("/send?team=" + tm + "&answer=" + rsp, () => {/*nessun callback*/});
  wait(); //si aspetta
}

function loadData(url, callback) {  //FUNZIONE ASINCRONA
  var xhttp = new XMLHttpRequest(); //istanziata una richiesta HTTP
  xhttp.onreadystatechange = function () {
    //evento chiamato ogni volta che cambia lo stato della richiesta
    if(this.readyState == 4 && this.status == 200) {  //quando lo stato è 4 (caricamento completato) e lo status (tipo 404 per capirci) è 200 (OK)
      var idx = parseInt(xhttp.responseURL.substr(xhttp.responseURL.length - 1, xhttp.responseURL.length));
      callback(xhttp.responseText, idx);  //callback chiamato col testo della risposta HTTP e l'indice (serve solo in script.js)
    }
  }
  xhttp.open("GET", url, true); //viene effettuata la richiesta GET all'url dato
  xhttp.send();
}
