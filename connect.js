var peer = new Peer(localStorage.getItem('peerId'));

peer.on('disconnected', () => {
    peer.reconnect();
});

peer.on('error', err => {
    if (err.type == 'unavailable-id') {
        // localStorage.removeItem('peerId');
    } else {
        msg(err);
    }
});

peer.on('open', id => {
    localStorage.setItem('peerId', id);

    if (isLieBrarians) {
        document.querySelector('.link').innerText = location.href + '?' + id;
        restore();
    } else {
        send('connecting');
    }
    document.querySelector('main').classList.add('ready');
    msg('已連線到網路');
});

if (isLieBrarians) {
    peer.on('connection', conn => {
        if (remotePeerIds.indexOf(conn.peer) === -1) {
            msg('對手連入');
            remotePeerIds.push(conn.peer);
            save();
        }
    });
} else {
    remotePeerIds[0] = location.search.replace('?', '');
}

peer.on('connection', conn => {
    conn.on('data', receiveData);
});

function send(data, msg = null, callBack = null, ignoreId = null) {
    if (msg) {
        console.log(msg);
        const div = document.createElement('div');
        div.textContent = msg;
        div.classList.add('msg');
        document.querySelector('.msgs').appendChild(div);
    }
    remotePeerIds.forEach(remotePeerId => {
        if (!ignoreId || remotePeerId != ignoreId) {
            const conn = peer.connect(remotePeerId);
            conn.on('open', () => {
                conn.send(data);
                if (callBack) callBack();
            });
        }
    });
}
