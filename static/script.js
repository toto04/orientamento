//gli elementi HTML utili
var question;
var options;
var imageDiv;
var displayAnswers;
var displayResults;

var colori = ["#FF0000", "#0099FF", "#FFFF00", "#00CC00"] //array con i colori per il grafico
var lettere = ["A", "B", "C", "D"]    //array con le lettere per il grafico

var timerInterval;  //timer, globale perché così lo posso uccidere da una funzione esterna
var spacePressed;   //funzione quando viene premuto spazio, varia nel tempo
var last = true;    //se è l'ultima domanda

window.onload = init  //init è la funzione chiamata al caricamento della pagina

function init() {
  //vengono caricati gli elementi utili
  question = document.getElementById('domanda').style;
  options = document.getElementById('options').style;
  imageDiv = document.getElementById('espImg').style;
  displayAnswers = document.getElementById('displayAnswers').style;
  displayResults = document.getElementById('displayResults').style;

  titleScene(); //scena del titolo
  if (two) {
    last = false; //se ci sono più domande, la prima non è l'ultima
  }

  document.onkeyup = (e) => {
    //per saltare le domande
    if (e.key == "1") {
      window.location = "/play/1"
    }
    if (e.key == "2") {
      window.location = "/play/2"
    }
    if (e.key == "3") {
      window.location = "/play/3"
    }
    if (e.key == "4") {
      window.location = "/play/4"
    }
    if (e.key == "5") {
      window.location = "/play/5"
    }
    if (e.key == " ") {
      //funzione chiamata quando si preme spazio
      spacePressed();
    }
  }

  spacePressed = function() {
    //premere barra spaziatrice carica la scena delle domande
    questionScene();
  }
}

function titleScene() {
  //impostati i css per la scenda del titolo
  console.log("title loaded");
  question.setProperty("display", "none");
  options.setProperty("display", "none");
  imageDiv.setProperty("width", "90%");
  displayAnswers.setProperty("display", "block");
  displayResults.setProperty("display", "none");
}

function questionScene() {
  //impostati i css per la scena delle domande
  console.log("question loaded");
  question.setProperty("display", "block");
  options.setProperty("display", "block");
  imageDiv.setProperty("width", "40%");
  displayAnswers.setProperty("display", "block");
  displayResults.setProperty("display", "none");

  spacePressed = function () {
    //ora premere barra spaziatrice fa iniziare il countdown
    startCD();
  }
}

function startCD() {
  spacePressed = function () {/*Non succede niente :)*/}

  var tmout = setTimeout(loadResults, tempo + 1000);  //alla fine del timeout vengono caricati i risultati

  var remaining = Math.ceil(tempo / 1000);  //secondi rimanenti
  document.getElementById('timerPost').innerHTML = remaining.toString();
  timerInterval = setInterval(() => {
    //viene creato un intervallo per far diminuire i secondi
    remaining--;
    if (remaining > 0) {
      document.getElementById('timerPost').innerHTML = remaining.toString();
    } else {
      document.getElementById('timerPost').innerHTML = "Fine!";
    }
  }, 1000)
  var rand = Math.floor(Math.random() * 10)
  //QUELLA BRUTTA PERSONA DEL BROWSER, se non metto dei parametri a caso nella chiamata me la cacha e la carica a caso
  //#avreidovutousareilPOSTinvecedelGET
  if (two && last) {
    loadData("/sendPlayCall?n=2&x=" + rand);
  } else {
    loadData("/sendPlayCall?x=" + rand);
  }
}

function loadResults() {
  clearInterval(timerInterval); //viene ucciso il timer per diminuire il timer
  document.getElementById('timerPost').innerHTML = "";  //Viene tolto il timer
  var counter = [0, 0, 0, 0];
  for (var i = 0; i < 4; i++) {
    loadData("/squadra/" + i, (x, idx) => {
      //Un ciclo for passa tutti le squadre, solo che essendo loadData una funzione asincrona,
      //viene chiamato il callback (questa funzione qua) DOPO alla fine del ciclo, quindi i è già 4, e va in out of index
      //quindi il parametro idx viene restituito, ovvero l'ultimo carattere dell'url, ovvero i essendo l'URL '"/squadra/" + i'
      document.getElementsByClassName('squadra')[idx].innerHTML = x;
    })
    loadData("/answ/" + i, (x, idx) => {
      //idem per le risposte date
      document.getElementsByClassName('answ')[idx].innerHTML = x;
      //Viene incrementato un contatore per controllare le risposte
      if (x == "A") {counter[0]++;}
      if (x == "B") {counter[1]++;}
      if (x == "C") {counter[2]++;}
      if (x == "D") {counter[3]++;}
      //c'è la tabella del grafico che viene importata in un array (perché ogni cella ha la classe 'graph') con indici:
      // [0,  1,  2,  3,
      //  4,  5,  6,  7,
      //  8,  9, 10, 11,
      // 12, 13, 14, 15,
      // 16, 17, 18, 19] (questa riga ha l'intestazione, il resto sono i blocchi del grafico)
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < counter[i]; j++) {
          //due cicli impostano il colore dello sfondo di una tabella che forma poi il grafico
          document.getElementsByClassName('graph')[(i+12)-(j*4)].style.setProperty("background-color", colori[i])
        }
        //L'ultima riga della tabella ha il la lettera della risposta con il totale di risposte date
        document.getElementsByClassName('graph')[i+16].innerHTML = lettere[i] + " (" + counter[i] + ")";
      }
    })
    loadData("/punteggio/" + i, (x, idx) => {
      //idem per i punteggi
      document.getElementsByClassName('tot')[idx].innerHTML = x;
    })
    loadData("/guadagno/" + i, (x, idx) => {
      //idem per i punti guadagnati nella singola sessione
      document.getElementsByClassName('gain')[idx].innerHTML = "(+" + x + ")";
    })
  }
  resultScene();  //caricata la scena dei risultati alla fine
}

function resultScene() {
  //alla fine viene caricata la scena dei risultati
  //console.log("result loaded");
  displayAnswers.setProperty("display", "none");  //si nascondono le risposte
  displayResults.setProperty("display", "block"); //si mostrano i risultati
  if (last) {
    spacePressed = function() {
      //Carica il nuovo esperimento se non ci sono più domande
      var url = window.location.href
      url = url.substr(url.length - 1, url.length);
      url = parseInt(url, 10);
      url++;
      window.location = "/play/" + url
    }
  } else {
    spacePressed = function() {
      //se non è l'ultima domanda allora va avanti con la seconda
      loadSecond();
    }
  }
}

function loadSecond() {
  loadData("/secondQuestion", (x) => {
    //viene sostituita la domanda con la seconda domanda
    document.getElementById('domanda').innerHTML = x;
  })
  loadData("/secondTimer", (x) => {
    tempo = parseInt(x, 10);
    //Viene caricata la pagina solo e soltanto quando viene rilevato il timer
    //Tanto gli altri elementi vengono aggiornati appena restituiti quindi sticazzi, magari sono in ritardo di pochi
    questionScene();
  })
  for (var i = 0; i < 4; i++) {
    loadData("/secondAnswer/" + i, (x, idx) => {
      //vengono caricate tutte le domande, in ordine con i 4 indici
      document.getElementsByClassName('opzione')[idx].innerHTML = x;
    })
  }
  last = true;  //È sicuramente l'ultima domanda, più di due non sono supportate, erano le 2 di notte
}

function loadData(url, callback) {  //FUNZIONE ASINCRONA, restituisce le cose quando finisce, a suo tempo, viene passata come parametro una funzione che viene chiamata alla fine
  var xhttp = new XMLHttpRequest(); //istanziata una richiesta HTTP
  xhttp.onreadystatechange = function () {
    //evento chiamato ogni volta che cambia lo stato della richiesta
    if(this.readyState == 4 && this.status == 200) {  //quando lo stato è 4 (caricamento completato) e lo status (tipo 404 per capirci) è 200 (ovvero OK)
      var idx = parseInt(xhttp.responseURL.substr(xhttp.responseURL.length - 1, xhttp.responseURL.length));
      callback(xhttp.responseText, idx);  //callback chiamato col testo della risposta HTTP e l'indice (serve solo in script.js)
    }
  }
  xhttp.open("GET", url, true); //viene effettuata la richiesta GET all'url dato
  xhttp.send(); //viene mandata la richiesta, a quanto pare è una roba diversa boh, vanno usati entrambi
}
