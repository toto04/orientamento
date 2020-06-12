//Moduli
const fs = require('fs'); //modulo file system per leggere i file html
const bodyParser = require('body-parser');
const express = require('express'); //Modulo che gestisce il traffico HTTP

//variabili globali
var timer; //il timer viene usato in più istanze
var currentIndex; //l'indice dell'esperimento corrente per l'array JSON
var startDate = Date.now(); //Il tempo all'inizio dello script
var html; //L'effettiva pagina HTML tenuta come una stringa gigante
var phoneHtml;  //La pagina HTML per telefoni, nella stessa stringa gigante
var state = "0";  //indica la sessione di gioco, si avrei potuto usare una variabile booleana
                  //ma una stringa era più facile da interpretare

class Team {
  //classe che rappresenta una squadra
  constructor() {
    //Costruttore, resetta tutti i parametri
    this.punteggio = 0;
    this.guadagno = 0;
    this.risposta = "Nessuna risposta :(";
    this.tempo = 0; //Volevo dare punteggi in base al tempo ma la cavallo ha detto no :(
  }
  initForPlaySession() {
    //Resetta tutti i parametri menché il punteggio, così da poter dare una risposta
    this.guadagno = 0;
    this.risposta = "Nessuna risposta :(";
    this.tempo = 0;
  }
}
var teams;  //array dei team
var classification; //array globale di classifica per bubblesort
function teamsInit() {
  //L'array viene inizializzato per contenere 4 istanze della classe
  teams = [];
  for (var i = 0; i < 4; i++) {
    teams.push(new Team());
  }
}

function orderTeams() {
  //Ordina la variabile classification per tenere conto della classifica in ordine
  //di punteggio, la variabile tiene i 4 indici delle squadre in ordine di punteggio
  classification = [0, 1, 2, 3]
  var arr = [0, 0, 0, 0];
  for (var i = 0; i < 4; i++) {
    arr[i] = teams[i].punteggio;
  }
  //bubblesort
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < (3 - i); j++) {
      if(arr[j] > arr[j+1]) {
        var tmp = arr[j];
        arr[j] = arr[j+1];
        arr[j+1] = tmp;

        tmp = classification[j];
        classification[j] = classification[j+1];
        classification[j+1] = tmp;
      }
    }
  }
  //Whooops il bubblesort va dal più piccolo al più grande, a me serve il contrario
  arr = classification.slice(0);  //clona l'array
  for (var i = 0; i < classification.length; i++) {
    //Lo rigira
    classification[i] = arr[3 - i];
  }
}

//Il file JSON contiene tutti gli esperimenti, vengono caricati in un array di oggetti
var experiments = JSON.parse(fs.readFileSync('./experiments.json', 'utf8'))

fs.readFile('./static/index.html', 'utf8', (err, page) => {
  //Carica l'HTML come stringa gigante
  html = page;
  //Cambia i riferimenti da relativi a assoluti, perché era più facile debuggare
  //css e javascript senza il server ON così
  html = html.replace("style.css", "/style.css");
  html = html.replace("script.js", "/script.js")
  html = html.replace("Immagini/Logonervi.png", "/Immagini/Logonervi.png")
})

fs.readFile('./static/phone.html', 'utf8', (err, page) => {
  //Carica l'HTML del telefono come stringa gigante
  phoneHtml = page;
  //Cambia i riferimenti da relativi a assoluti, perché era più facile debuggare
  //css e javascript senza il server ON così
  phoneHtml = phoneHtml.replace("phonestyle.css", "/phonestyle.css");
  phoneHtml = phoneHtml.replace("phonescript.js", "/phonescript.js")
  phoneHtml = phoneHtml.replace("Immagini/Logonervi.png", "/Immagini/Logonervi.png")
})

var app = express();  //Crea un'istanza del server

app.use(bodyParser.urlencoded({ extended: false }));  //Non ricordo cosa fanno queste 2 righe
app.use(bodyParser.json()); //Probabilmente qualcosa per gestire i POST http ma non li uso in realtà quindi boh

app.get('/init', (req, res) => {
  //Il gioco viene inizializzato, gli oggetti vengono resettatti a punteggio 0
  teamsInit();
  res.sendFile(__dirname + "/static/init.html") //File init.html intoccato
})

//La pagina effettiva dove giocare
app.get("/play/:page", (req, res) => {
  //Vengono sostituiti nell'HTML i parametri caricati dal JSON
  //Guardare static/index.html per vedere cosa viene sostituito
  currentIndex = parseInt(req.params.page, 10) - 1;
  if (currentIndex > 5 ) {
    //reinizializza il gioco
    res.redirect("/init")
  }
  var doc = html.replace("TITOLO", experiments[currentIndex].title);
  if (experiments[currentIndex].ques.length > 1) {
    //Se ci sono due domande lo script lo saprà con una variabile booleana
    doc = doc.replace("false", "true");
  }
  //viene caricata la prima domanda
  doc = doc.replace("20000", experiments[currentIndex].ques[0].millis)
  doc = doc.replace("DOMANDA", experiments[currentIndex].ques[0].question)
  for (var i = 0; i < 4; i++) {
    doc = doc.replace("RISPOSTA" + (i + 1), experiments[currentIndex].ques[0].answers[i])
  }
  res.send(doc);  //Viene mandato l'HTML con i parametri sostituiti
})

app.get('/Immagini/esp.jpg', (req, res) => {
  //Il CSS indirizza l'immagine dell'esperimento all'url di cui sopra
  //Viene restituita l'immagine definita dal file JSON
  res.sendFile(__dirname + "/static" + experiments[currentIndex].imgURL);
})

app.get('/phone/:team', (req, res) => {
  //Richiesta dei telefoni
  //Viene modificato il titolo con il numero della squadra
  var team = req.params.team;
  var doc = phoneHtml.replace("NUM", team);
  res.send(doc);
})

app.get('/send', (req, res) => {
  //URL a cui mandare la risposta data (/send?team=1&answer=A)
  //Lo so lo so, avrei dovuto mandare un POST HTTP al posto di un normale GET HTTP
  //Non sono perfetto, non mi riusciva, di nuovo, erano le 2 di notte, ho deciso di mandare
  //un GET con due parametri invece di un post fatto per bene, oh beh funziona
  res.end();  //niente da resistuire
  var tm = parseInt(req.query.team, 10) - 1;
  var answ = req.query.answer;
  //Viene impostato il parametro risposta dell oggetto giusto in base alla risposta data
  teams[tm].risposta = answ;
})

//URL per il pulling della sessione di gioco, così il telefono sa quando chiedere la risposta
app.get('/gameState', (req, res) => { res.send(state) })


//Richieste ai telecomandi
app.get('/sendPlayCall', (req, res) => {
  //Viene mandata una richiesta a quest'URL per far iniziare una sessione di gioco
  res.end();  //La richiesta cessa senza risposta, tanto sti cazzi, non deve rispondere niente di utile
  state = "1"; //La variabile di stato della sessione di gioco viene portata a 1
  //console.log("Play Call!");
  for (var i = 0; i < teams.length; i++) {
    //Gli oggetti vengono inizializzati per la sessione di gioco, i punteggi rimangono
    teams[i].initForPlaySession();
  }

  var cd; //countdown
  var snd;  //se ci sono due domande (solo primo esperimento)
  if (req.query.n != "2") { //viene letto un parametro nell'url (/sendPlayCall?n=2)
    snd = false;
    cd = parseInt(experiments[currentIndex].ques[0].millis);
  } else {
    //Se c'è il parametro allora viene preso il countdown della seconda volta
    //console.log("Oh that's the second time!");
    snd = true;
    cd = parseInt(experiments[currentIndex].ques[1].millis);
  }
  timer = setTimeout(() => {
    //Alla fine del countdown viene inviata la richiesta di terminare la sessione
    //passando come parametro se è la seconda domanda
    sendStop(snd);
  }, cd);
})

function sendStop(second) {
  state = "0";  //lo stato viene riportato a 0
  //console.log("Time's up!");
  var correctAnsw;
  if (second) { //se è la seconda domanda allora guarda la giusta riposta corretta
    correctAnsw = experiments[currentIndex].ques[1].correct;
  } else {
    correctAnsw = experiments[currentIndex].ques[0].correct;
  }
  for (var i = 0; i < teams.length; i++) {
    //Viene confrontata la risposta data con quella corretta
    if (teams[i].risposta == correctAnsw) {
      //Guadagno di 100 punti, prima doveva dipendere dal tempo (rip albertina)
      teams[i].guadagno = 100;
    } else {
    }
    teams[i].punteggio += teams[i].guadagno;
  }
  orderTeams(); //Chiama la funzione per generare l'array di classifica
}

//Funzioni per la seconda domanda richieste via AJAX in caso di due domande
app.get('/secondTimer', (req, res) => {
  //pagina che restituisce il countdown per la seconda domanda, per aggiornare il javascript
  res.send(experiments[currentIndex].ques[0].millis);
  //in realtà guarda quello della prima domanda, quindi questa roba è completamente inutile
  //inizialmente funzionava con la seconda (indice [1]) però ho notato che era lo stesso timer nella prima domanda
  //e mi serviva un URL per prendere il countdown dal telefono, ho solo riciclato questo pigramente
  //scusate erano le 2 di notte
})
app.get('/secondQuestion', (req, res) => {
  //pagina che restituisce la seconda domanda, per sostituirla senza ricaricare
  res.send("<h2>" + experiments[currentIndex].ques[1].question + "</h2>");
})
app.get('/secondAnswer/:ind', (req, res) => {
  //pagina che restituisce una risposta
  var ind = parseInt(req.params.ind, 10);
  var lettera;
  //In base all'indice prende il suffisso
  switch (ind) {
    case 0:
    lettera = "A) "
    break;
    case 1:
    lettera = "B) "
    break;
    case 2:
    lettera = "C) "
    break;
    case 3:
    lettera = "D) "
    break;
    default:
    lettera = "";
  }
  //Restituisce un paragrafo con il suffisso e la relativa risposta
  res.send("<p>" + lettera + experiments[currentIndex].ques[1].answers[ind] + "</p>");
})


//Pagine per i risultati richiesti via AJAX dalla pagina
app.get('/squadra/:ind', (req, res) => {
  //In ordine di classifica le squadre
  var ind = parseInt(req.params.ind, 10);
  res.send("Squadra " + (classification[ind] + 1));
});
app.get('/answ/:ind', (req, res) => {
  //Usa la classifica come indice per l'array di oggetti e restituisce la risposta
  var ind = parseInt(req.params.ind, 10);
  res.send(String(teams[classification[ind]].risposta))
});
app.get('/punteggio/:ind', (req, res) => {
  //Usa la classifica come indice per l'array di oggetti e restituisce il punteggio
  var ind = parseInt(req.params.ind, 10);
  res.send(String(teams[classification[ind]].punteggio))
});
app.get('/guadagno/:ind', (req, res) => {
  //Usa la classifica come indice per l'array di oggetti e restituisce il guadagno del turno
  var ind = parseInt(req.params.ind, 10);
  res.send(String(teams[classification[ind]].guadagno))
});

//stesse funzioni, ma con l'indice di squadra invece che con la posizione in classifica
//Ogni telefono chiede il suo specifico parametro
app.get('/answPhone/:ind', (req, res) => {
  var ind = parseInt(req.params.ind, 10);
  res.send(String(teams[ind].risposta))
});
app.get('/punteggioPhone/:ind', (req, res) => {
  var ind = parseInt(req.params.ind, 10);
  res.send(String(teams[ind].punteggio))
});
app.get('/guadagnoPhone/:ind', (req, res) => {
  var ind = parseInt(req.params.ind, 10);
  res.send(String(teams[ind].guadagno))
});


//Per tutte le altre richieste viene usata la directory /static
//In questo modo file inalterati quali .css e .js verranno pescati direttamente da lì
app.use(express.static(__dirname + '/static'));

// Infine, il server va on sulla porta 80. OOF.
app.listen(80, () => {
  console.log("Server's UP on port 80!");
})
