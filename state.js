var isLieBrarian = location.search == '';
var lieBrarianPeerId = location.search.replace('?', '');

if (location.search == '?clear') {
    localStorage.clear();
    location.href = './';
}

if (!isLieBrarian) {
    localStorage.removeItem('peerId');
    localStorage.removeItem('answerCodes');
    localStorage.removeItem('answer');
    localStorage.removeItem('remotePeerIds');
    localStorage.removeItem('guessCodes');
    localStorage.removeItem('results');
    localStorage.removeItem('liedResults');
    localStorage.removeItem('tOFCount');
    localStorage.removeItem('guesses');
    localStorage.removeItem('keyboard');
}

var remotePeers = {};
var answerCodes = JSON.parse(localStorage.getItem('answerCodes')) || [];
var guessCodes = JSON.parse(localStorage.getItem('guessCodes')) || [];
var results = JSON.parse(localStorage.getItem('results')) || [];
var liedResults = JSON.parse(localStorage.getItem('liedResults')) || [];
var tOFCount = localStorage.getItem('tOFCount') || 0;

var lieCode;


if (localStorage.getItem('guesses')) {
    document.querySelector('.guesses').innerHTML = localStorage.getItem('guesses');
}
if (localStorage.getItem('answer')) {
    document.querySelector('.answer').outerHTML = localStorage.getItem('answer');
}
if (localStorage.getItem('keyboard')) {
    document.querySelector('.keyboard').innerHTML = localStorage.getItem('keyboard');
}

function save() {
    localStorage.setItem('remotePeerIds', JSON.stringify(Object.keys(remotePeers)));
    localStorage.setItem('answerCodes', JSON.stringify(answerCodes));
    localStorage.setItem('guessCodes', JSON.stringify(guessCodes));
    localStorage.setItem('results', JSON.stringify(results));
    localStorage.setItem('liedResults', JSON.stringify(liedResults));
    localStorage.setItem('tOFCount', tOFCount);
    localStorage.setItem('guesses', document.querySelector('.guesses').innerHTML);
    localStorage.setItem('keyboard', document.querySelector('.keyboard').innerHTML);
}