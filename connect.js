var peer = new Peer();

var remotePeerIds = [];

var isLieBrarians = location.search == '';

peer.on('disconnected', () => {
    peer.reconnect();
});

peer.on('open', id => {
    if (isLieBrarians) document.querySelector('.link').innerText = location.href + '?' + id;
    msg('已連線到網路')
});

peer.on('connection', conn => {
    conn.on('data', data => {
        navigator.vibrate(200);
        if (isLieBrarians) {
            if (remotePeerIds.indexOf(conn.peer) === -1) remotePeerIds.push(conn.peer);
            if (Array.isArray(data)) {
                guessCodes = data;
                checkAnswer();
            } else if (typeof data == 'number') {
                if (tOFCount < 3) {
                    const checkedGuess = document.querySelectorAll('.submited.checked');
                    const lastGuess = checkedGuess[checkedGuess.length - 1];
                    if (!lastGuess.classList.contains('fact-or-fiction')) {
                        lastGuess.classList.add('fact-or-fiction');
                        const codes = lastGuess.querySelectorAll('.code');
                        const tOF = results[data] == liedResults[data]
                        codes[data].classList.add(tOF ? 'fact' : 'fiction');
                        send([data, tOF ? 1 : 0]);
                        tOFCount++;
                    }
                }
            } else {
                console.log(data)
            }
        } else {
            if (Array.isArray(data)) {
                if (data.length == 5) {
                    const guess = document.querySelector('.guess.submited:not(.checked)');
                    guess.querySelectorAll('.code').forEach((b, i) => {
                        b.classList.add(data[i]);
                    });
                    guess.classList.add('checked');
                } else {
                    const guesses = document.querySelectorAll('.guess.submited.checked');
                    const lastGuess = guesses[guesses.length - 1];
                    const codes = lastGuess.querySelectorAll('.code');
                    const checkCode = codes[data[0]];
                    const tOF = data[1];

                    checkCode.classList.add(tOF ? 'fact' : 'fiction');
                    checkCode.parentNode.parentNode.classList.add('fact-or-fiction');
                    tOFCount++;
                    const keys = document.querySelectorAll('.key');
                    if (tOF) {
                        keys.forEach(key => {
                            if (key.innerText == checkCode.innerText) {
                                key.classList.remove('check', 'tilde', 'x');
                                if (checkCode.classList.contains('check')) key.classList.add('check');
                                if (checkCode.classList.contains('tilde')) key.classList.add('tilde');
                                if (checkCode.classList.contains('x')) key.classList.add('x');
                            }
                        });
                    } else {
                        codes.forEach(code => {
                            if (code.innerText != checkCode.innerText) {
                                keys.forEach(key => {
                                    if (key.innerText == code.innerText) {
                                        key.classList.remove('check', 'tilde', 'x');
                                        if (code.classList.contains('check')) key.classList.add('check');
                                        if (code.classList.contains('tilde')) key.classList.add('tilde');
                                        if (code.classList.contains('x')) key.classList.add('x');
                                    }
                                });
                            }
                        })
                    }
                }
            } else if (data == '答對了') {
                const guess = document.querySelector('.guess.submited:not(.checked)');
                guess.querySelectorAll('.code').forEach((b, i) => {
                    b.classList.add('check');
                });
                document.querySelector('.wmsg.waiting').style="display:none";
                alert(data);
                peer.destroy();
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
    remotePeerIds.forEach(remotePeerId => {
        const conn = peer.connect(remotePeerId);
        conn.on('open', () => {
            conn.send(data);
            if (callBack) callBack();
        });
    });
}
