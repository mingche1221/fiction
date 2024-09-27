
document.body.classList.add(isLieBrarian ? 'lie-brarian' : 'players');
document.body.dataset.identity = isLieBrarian ? 'lie-brarian' : 'players';

document.querySelector('.keyboard').addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
        const key = e.target;
        const editKey = document.getElementById('edit_key');
        if (editKey.checked) {
            if (!key.classList.contains('back') && !key.classList.contains('enter') && !key.classList.contains('placeholder')) {
                const checkClass = rotateClass(key, 1);
                send(['edit-key', key.innerText, checkClass]);
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
        if (isLieBrarian) {
            const guessing = document.querySelector('.guess.submited:not(.checked)');
            if (guessing) {
                guessing.classList.remove('wrong');
                if (lieCode != e.target) {
                    document.querySelectorAll('.guess.submited:not(.checked) .code').forEach((b, i) => {
                        b.classList.remove('x', 'check', 'tilde');
                        b.classList.add(results[i]);
                    });
                    lieCode = e.target;
                }
                rotateClass(lieCode);
            }
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
    if (isLieBrarian) {
        if (Array.isArray(data)) {
            if (data.length == 5) {
                guessCodes = data;
                send(['msg', `圖書館員收到${features[peerfeatures[conn.peer]]}的猜測`], `收到${features[peerfeatures[conn.peer]]}的猜測`);
                checkAnswer();
                send(['guesses', document.querySelector('.guesses').innerHTML]);
            } else {
                switch (data[0]) {
                    case 'keyboard':
                        document.querySelector('.keyboard').innerHTML = data[1];
                        // send(['keyboard', data[1]], '鍵盤已更新', null, data[2]);
                        send(['msg', '鍵盤已更新'], null, null, data[2]);
                        break;
                    case 'user-message':
                        msg(data[1], ['user-message', peerfeatures[conn.peer]]);
                        send(['user-message', data[1], peerfeatures[conn.peer]]);
                        break;
                    case 'start-edit-key':
                        send(['msg', `${features[peerfeatures[conn.peer]]}正在編輯鍵盤`], `${features[peerfeatures[conn.peer]]}正在編輯鍵盤`, null, conn.peer);
                        break;
                    case 'end-edit-key':
                        send(['msg', `${features[peerfeatures[conn.peer]]}完成鍵盤編輯`], `${features[peerfeatures[conn.peer]]}完成鍵盤編輯`, null, conn.peer);
                        break;
                    case 'edit-key':
                        const keys = document.querySelectorAll('.key');
                        keys.forEach((key, i) => {
                            if (key.innerText == data[1]) {
                                key.classList.remove('x', 'tilde', 'check');
                                if (data[2]) {
                                    key.classList.add(data[2]);
                                }
                                send(['edit-key', i, data[2]], null, null, conn.peer)
                            }
                        });
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
                    send(['msg', `${features[peerfeatures[conn.peer]]}檢查了一個位置，剩餘 ${(3 - tOFCount)} 次`, `${features[peerfeatures[conn.peer]]}檢查了一個位置，剩餘 ${(3 - tOFCount)} 次`]);
                    send(['guesses', document.querySelector('.guesses').innerHTML]);
                    send(['tOFCount', tOFCount]);
                    send(['keyboard', document.querySelector('.keyboard').innerHTML]);
                }
            }
        } else if (data == 'connecting') {
            conn.send(['msg', `已連接圖書館員。代號：${features[peerfeatures[conn.peer]]}`]);
            conn.send(['guesses', document.querySelector('.guesses').innerHTML]);
            conn.send(['keyboard', document.querySelector('.keyboard').innerHTML]);
            conn.send(['header', document.querySelector('header').outerHTML]);
            conn.send(['tOFCount', tOFCount]);
            conn.send(['identity', peerfeatures[conn.peer]]);
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
            case 'edit-key':
                const keys = document.querySelectorAll('.key');
                keys[data[1]].classList.remove('x', 'tilde', 'check');
                keys[data[1]].classList.add(data[2]);
                break;
            case 'user-message':
                const identity = data[2] == document.body.dataset.identity ? 'me' : data[2];
                msg(data[1], ['user-message', identity]);
                break;
            case 'header':
                document.querySelector('header').outerHTML = data[1];
                break;
            case 'identity':
                document.body.dataset.identity = data[1];
                break;
            case 'c':
                document.querySelector('.answer').outerHTML = data[1];
                document.querySelector('.wmsg.waiting').style="display:none";
                msg('猜對了！', ['fixed']);
                alert('猜對了！');
                peer.destroy();
                localStorage.clear();
                break;
            case 'f':
                document.querySelector('.answer').outerHTML = data[1];
                document.querySelector('.wmsg.waiting').style="display:none";
                msg('10 次機會用完了！', ['fixed']);
                alert('10 次機會用完了！');
                peer.destroy();
                localStorage.clear();
                break;
            default:
                alert(data);
                break;
        }

    }

}

function msg(msg, classes = null) {
    console.log(msg);
    const div = document.createElement('div');
    div.textContent = msg;
    div.classList.add('msg');
    if (classes) div.classList.add(...classes);
    document.querySelector('.msgs').prepend(div)
}

function refresh() {
    const codeArea = document.querySelector(isLieBrarian ? '.answer' : '.guesses .guess:not(.submited)');
    codeArea.classList.remove('wrong');
    document.querySelectorAll(isLieBrarian ? '.answer:not(.submited) .code' : '.guess:not(.submited) .code').forEach((b, i) => {
        b.innerText = guessCodes[i] ?? '';
    });
}
function submit() {
    const codeArea = document.querySelector(isLieBrarian ? '.answer:not(.submited)' : '.guess:not(.submited)');
    if (guessCodes.length == 5) {
        const words = guessCodes.reduce((obj, key) => obj && obj[key], dict);
        if (words) {
            if (isLieBrarian) {
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
            msg('找不到符合的詞');
        }
    } else {
        codeArea.classList.add('wrong');
        msg('字數不足');
    }
}
function checkAnswer(conn) {
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
        msg('被猜中了！', ['fixed']);
        localStorage.clear();
    } else if (document.querySelectorAll('.guess.submited').length == 10) {
        codeArea.classList.add('checked');
        send(['f', document.querySelector('.answer').outerHTML]);
        msg('10 次機會用完了！', ['fixed']);
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
        send(['msg', '圖書館員已回應猜測']);
        send(['guesses', document.querySelector('.guesses').innerHTML]);
    } else {
        guess.classList.add('wrong');
    }

    save();
}

function rotateClass(ele, withEmpty = false) {
    if (ele.classList.contains('x')) {
        ele.classList.replace('x', 'tilde');
        return 'tilde';
    } else if (ele.classList.contains('tilde')) {
        ele.classList.replace('tilde', 'check');
        return 'check';
    } else if (ele.classList.contains('check')) {
        ele.classList.remove('check');
        if (withEmpty) {
            return '';
        } else {
            ele.classList.add('x');
            return 'x';
        }
    } else {
        ele.classList.add('x');
        return 'x';
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
        // send(['keyboard', document.querySelector('.keyboard').innerHTML, peer.id]);
        send(['end-edit-key'], '完成鍵盤編輯');
        document.querySelector('.guesses').classList.remove('blur')
        document.querySelector('body').classList.remove('blur')
    } else {
        send(['start-edit-key'], '開始鍵盤編輯');
        document.querySelector('.guesses').classList.add('blur')
        document.querySelector('body').classList.add('blur')
    }
}

function toggleMessageInput() {
    const messageInputLightbox = document.getElementById('message_input_lightbox');
    messageInputLightbox.classList.toggle('show');
    document.getElementById('message_input').focus();
    document.querySelector('.msgs').classList.toggle('show', messageInputLightbox.classList.contains('show'));
    document.querySelector('.keyboard').classList.toggle('hide', messageInputLightbox.classList.contains('show'));
    document.querySelector('.guess:not(.submited)').classList.toggle('hide', messageInputLightbox.classList.contains('show'));
}

function sendMessage(e) {
    e.preventDefault();
    const messageInput = document.getElementById('message_input');
    if (isLieBrarian) {
        msg(messageInput.value, ['user-message', 'me']);
        send(['user-message', messageInput.value, 'liebrarian']);
    } else {
        send(['user-message', messageInput.value]);
    }
    messageInput.value = '';
    // document.getElementById('message_input_lightbox').classList.remove('show');
}
document.getElementById('message_form').addEventListener('submit', e => {
    sendMessage(e);
});