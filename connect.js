var peer;
var remotePeerIds = [];

var isLieBrarians = location.search == '';

const storePeerId = localStorage.getItem('peerId');

if (storePeerId) {
    peer = new Peer(storePeerId);
} else {
    peer = new Peer();
}

peer.on('disconnected', () => {
    msg('連線中斷，正在恢復連線')
    peer.reconnect();
});

peer.on('open', id => {
    if (isLieBrarians) document.querySelector('.link').innerText = location.href + '?' + id;
    localStorage.setItem('peerId', id);
    msg('已連線到網路')
});

peer.on('error', err => msg('peer error: ' + err));

peer.on('connection', conn => {
    conn.on('data', data => {
        if (isLieBrarians) {
            remotePeerIds[0] = conn.peer;
            if (Array.isArray(data)) {
                guessCodes = data;
                checkAnswer();
            } else if (typeof data == 'number') {
                const checkedGuess = document.querySelectorAll('.submited.checked');
                const lastGuess = checkedGuess[checkedGuess.length - 1];
                const codes = lastGuess.querySelectorAll('.code');
                const tOF = results[data] == liedResults[data]
                codes[data].classList.add(tOF ? 'truth' : 'fiction');
                send(tOF ? 1 : 0);
            } else {
                console.log(data)
            }
        } else {
            if (Array.isArray(data)) {
                const guess = document.querySelector('.guess.submited:not(.checked)');
                guess.querySelectorAll('.code').forEach((b, i) => {
                    b.classList.add(data[i]);
                });
                guess.classList.add('checked');
            } else if (typeof data == 'number') {
                truthOrFiction.classList.add(data ? 'truth' : 'fiction');
                truthOrFiction.parentNode.parentNode.classList.add('truth-or-fiction');
                tOFCount++;
            } else {
                alert(data);
            }
        }
    });
});


if (isLieBrarians) {
    document.body.classList.add('lie-brarians');
} else {
    document.body.classList.add('players')
    remotePeerIds[0] = location.search.replace('?', '');
}

function send(data, msg = null, callBack = null) {
    if (msg) {
        console.log(msg);
        const div = document.createElement('div');
        div.textContent = msg;
        div.classList.add('msg');
        document.querySelector('.msgs').appendChild(div);
    }
    conn = peer.connect(remotePeerIds[0]);
    conn.on('open', () => {
        conn.send(data);
        if (callBack) callBack();
    });
}
