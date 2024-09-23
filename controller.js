
document.body.classList.add(isLieBrarians ? 'lie-brarians' : 'players');

document.querySelector('.keyboard').addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
        const key = e.target;
        const editKey = document.getElementById('edit_key');
        if (editKey.checked) {
            if (!key.classList.contains('back') && !key.classList.contains('enter')) {
                rotateClass(key, 1);
            }
        } else {
            if (key.innerText != '' && guessCodes.length < 5) {
                guessCodes.push(key.innerText);
                refresh();
            }
            if (key.classList.contains('back') && guessCodes.length > 0) {
                guessCodes.splice(-1);
                refresh();
            }
            if (key.classList.contains('enter')) {
                submit();
            }
        }
    }
});
document.querySelector('.guesses').addEventListener('click', e => {
    if (e.target.classList.contains('code')) 
        if (isLieBrarians) {
            document.querySelector('.guess.submited:not(.checked)').classList.remove('wrong');
            if (lieCode != e.target) {
                document.querySelectorAll('.guess.submited:not(.checked) .code').forEach((b, i) => {
                    b.classList.remove('x', 'check', 'tilde');
                    b.classList.add(results[i]);
                });
                lieCode = e.target;
            }
            rotateClass(lieCode);
        } else {
            if (tOFCount < 3) {
                const lastGuess = getLastGuess();
                if (lastGuess && !lastGuess.classList.contains('fact-or-fiction')) {
                    lastGuess.querySelectorAll('.code').forEach((b, i) => {
                        if (b.innerText == e.target.innerText) {
                            send(i, '確認中');
                        }
                    })
                }
            }
        }
});

function receiveData(data, conn = null) {
    if (isLieBrarians) {
        if (Array.isArray(data)) {
            if (data.length == 5) {
                guessCodes = data;
                send(['msg', '出題者已收到猜測']);
                checkAnswer();
                send(['guesses', document.querySelector('.guesses').innerHTML]);
            } else {
                switch (data[0]) {
                    case 'keyboard':
                        document.querySelector('.keyboard').innerHTML = data[1];
                        send(['keyboard', data[1]], '鍵盤已更新', null, data[2]);
                        send(['msg', '鍵盤已更新'], null, null, data[2]);
                        break;
                    default:
                        break;
                }
            }
        } else if (typeof data == 'number') {
            if (tOFCount < 3) {
                const checkedGuess = document.querySelectorAll('.submited.checked');
                const lastGuess = checkedGuess[checkedGuess.length - 1];
                if (!lastGuess.classList.contains('fact-or-fiction')) {
                    lastGuess.classList.add('fact-or-fiction');
                    const codes = lastGuess.querySelectorAll('.code');
                    const tOF = results[data] == liedResults[data]
                    codes[data].classList.add(tOF ? 'fact' : 'fiction');
                    // send([data, tOF ? 1 : 0]);
                    tOFCount++;

                    const keys = document.querySelectorAll('.key');
                    if (tOF) {
                        keys.forEach(key => {
                            if (key.innerText == codes[data].innerText) {
                                if (codes[data].classList.contains('check')) key.classList.add('definite-check');
                                if (codes[data].classList.contains('tilde')) key.classList.add('definite-tilde');
                                if (codes[data].classList.contains('x')) key.classList.add('definite-x');
                            }
                        });
                    } else {
                        codes.forEach(code => {
                            if (code.innerText != codes[data].innerText) {
                                keys.forEach(key => {
                                    if (key.innerText == code.innerText) {
                                        if (code.classList.contains('check')) key.classList.add('definite-check');
                                        if (code.classList.contains('tilde')) key.classList.add('definite-tilde');
                                        if (code.classList.contains('x')) key.classList.add('definite-x');
                                    }
                                });
                            }
                        })
                    }

                    save();
                    send(['msg', `已檢查，剩餘 ${(3 - tOFCount)} 次`]);
                    send(['guesses', document.querySelector('.guesses').innerHTML]);
                    send(['tOFCount', tOFCount]);
                    send(['keyboard', document.querySelector('.keyboard').innerHTML]);
                }

            }
        } else if (data == 'connecting') {
            conn.send(['msg', '已連接出題者']);
            conn.send(['guesses', document.querySelector('.guesses').innerHTML]);
            conn.send(['keyboard', document.querySelector('.keyboard').innerHTML]);
            conn.send(['tOFCount', tOFCount]);
        } else {
            console.log(data)
        }
    } else {
        switch (data[0]) {
            case 'msg':
                msg(data[1]);
                break;
            case 'guesses':
                document.querySelector('.guesses').innerHTML = data[1];
                refresh();
                break;
            case 'tOFCount':
                tOFCount = data[1];
                break;
            case 'keyboard':
                document.querySelector('.keyboard').innerHTML = data[1];
                break;
            case 'c':
                document.querySelector('.answer').outerHTML = data[1];
                document.querySelector('.wmsg.waiting').style="display:none";
                msg('猜對了！', true);
                alert('猜對了！');
                peer.destroy();
                break;
            case 'f':
                document.querySelector('.answer').outerHTML = data[1];
                document.querySelector('.wmsg.waiting').style="display:none";
                msg('10 次機會用完了！', true);
                alert('10 次機會用完了！');
                peer.destroy();
                break;
            default:
                alert(data);
                break;
        }

    }

}

function msg(msg, fixed = false) {
    console.log(msg);
    const div = document.createElement('div');
    div.textContent = msg;
    div.classList.add('msg');
    if (fixed) div.classList.add('fixed');
    document.querySelector('.msgs').appendChild(div)
}

function refresh() {
    const codeArea = document.querySelector(isLieBrarians ? '.answer' : '.guesses .guess:not(.submited)');
    codeArea.classList.remove('wrong');
    document.querySelectorAll(isLieBrarians ? '.answer:not(.submited) .code' : '.guess:not(.submited) .code').forEach((b, i) => {
        b.innerText = guessCodes[i] ?? '';
    });
}
function submit() {
    const codeArea = document.querySelector(isLieBrarians ? '.answer:not(.submited)' : '.guess:not(.submited)');
    if (guessCodes.length == 5) {
        const words = guessCodes.reduce((obj, key) => obj && obj[key], dict);
        if (words) {
            if (isLieBrarians) {
                codeArea.querySelector('.words').innerText = words.join(', ');
                answerCodes = guessCodes;
                codeArea.classList.add('submited');
                guessCodes = [];

                localStorage.setItem('answerCodes', JSON.stringify(answerCodes));
                localStorage.setItem('answer', document.querySelector('.answer').outerHTML);
                save();
            } else send(guessCodes, '傳送中', () => {
                codeArea.querySelector('.words').innerText = words.join(', ');
                codeArea.classList.add('submited');
                guessCodes = [];
            });
        } else {
            codeArea.classList.add('wrong');
        }
    } else {
        codeArea.classList.add('wrong');
    }
}
function checkAnswer() {
    const guess = document.querySelector('.guess:not(.submited)');
    let checkCount = 0;
    guess.querySelectorAll('.code').forEach((code, i) => {
        let result = 'x';
        code.innerText = guessCodes[i];
        if (answerCodes.indexOf(guessCodes[i]) != -1) result = 'tilde';
        if (answerCodes[i] == guessCodes[i]) {
            result = 'check';
            checkCount++;
        };
        results[i] = result;
        code.classList.add(result);
    });
    liedResults = [];

    const codeArea = document.querySelector('.guess:not(.submited)');
    const words = guessCodes.reduce((obj, key) => obj && obj[key], dict);
    codeArea.querySelector('.words').innerText = words.join(', ');
    codeArea.classList.add('submited');

    save();

    if (checkCount == 5) {
        codeArea.classList.add('checked');
        send(['c', document.querySelector('.answer').outerHTML]);
        msg('被猜中了！', true);
        localStorage.clear();
    } else if (document.querySelectorAll('.guess.submited').length == 10) {
        codeArea.classList.add('checked');
        send(['f', document.querySelector('.answer').outerHTML]);
        msg('10 次機會用完了！', true);
        localStorage.clear();
    }
}
function lie() {
    const guess = document.querySelector('.guess.submited:not(.checked)');
    liedResults = [];

    document.querySelectorAll('.guess.submited:not(.checked) .code').forEach((b, i) => {
        if (b.classList.contains('x')) liedResults.push('x');
        else if (b.classList.contains('check')) liedResults.push('check');
        else if (b.classList.contains('tilde')) liedResults.push('tilde');
    });

    if (JSON.stringify(liedResults) !== JSON.stringify(results)) {
        guess.classList.add('checked');
        // send(liedResults);
        send(['msg', '出題者已回應猜測']);
        send(['guesses', document.querySelector('.guesses').innerHTML]);
    } else {
        guess.classList.add('wrong');
    }

    save();
}

function rotateClass(ele, withEmpty = false) {
    if (ele.classList.contains('x')) {
        ele.classList.replace('x', 'tilde');
    } else if (ele.classList.contains('tilde')) {
        ele.classList.replace('tilde', 'check');
    } else if (ele.classList.contains('check')) {
        ele.classList.remove('check');
        if (!withEmpty) ele.classList.add('x');
    } else {
        ele.classList.add('x');
    }
}

function getLastCodes() {
    const lastGuess = getGuessingGuess();
    return lastGuess.querySelectorAll('.code');
}

function getLastGuess() {
    const checkedGuess = document.querySelectorAll('.submited.checked');
    return checkedGuess[checkedGuess.length - 1];
}

document.querySelector('.copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(document.querySelector('.link').innerText)
    .then(() => {
        msg('連結已複製');
    })
    .catch((err) => {
        msg('複製失敗');
    });
});

function sendClientKeyboard() {
    if (!document.getElementById('edit_key').checked) {
        send(['keyboard', document.querySelector('.keyboard').innerHTML, peer.id]);
    }
}