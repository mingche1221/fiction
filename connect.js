var peer = new Peer(localStorage.getItem(isLieBrarians ? 'peerId' : location.search.replace('?', '')));



peer.on('disconnected', () => {
    peer.reconnect();
});

peer.on('error', err => {
    if (err.type == 'unavailable-id') {
        // localStorage.removeItem('peerId');
    }
    msg(err);
});

peer.on('open', id => {
    localStorage.setItem(isLieBrarians ? 'peerId' : location.search.replace('?', ''), id);

    if (isLieBrarians) {
        document.querySelector('.link').innerText = location.href + '?' + id;
        restore();
        peer.on('connection', conn => {
            conn.on('data', data => {receiveData(data, conn)});
            addPeer(conn);
        });
    } else {
        const lieBrariansPeerId = location.search.replace('?', '');
        const conn = peer.connect(lieBrariansPeerId);
        conn.on('data', receiveData);
        remotePeerIds[lieBrariansPeerId] = conn;
        conn.on('open', () => {
            send('connecting')
        });
        conn.on('error', err => msg(err))
        peer.on('connection', conn => {
            remotePeerIds[lieBrariansPeerId] = conn;
            conn.on('data', receiveData);
        });
    }
    document.querySelector('main').classList.add('ready');
    msg('已連線到網路');

});

function send(data, message = null, callBack = null, ignoreId = null) {
    if (message) {
        msg(message)
    }
    Object.values(remotePeerIds).forEach(conn => {
        if (!ignoreId || conn.peer != ignoreId) {
            if (conn.open) {
                conn.send(data);
            } else {
                const newConn = peer.connect(conn.peer);
                remotePeerIds[conn.peer] = newConn;
                newConn.on('data', receiveData);
                newConn.on('open', () => {
                    newConn.send(data);
                });
                msg('重新連線中');
            }
            if (callBack) callBack();
        }
    });
}

function addPeer(idOrConn) {
    if (typeof idOrConn === 'object') {
        const conn = idOrConn;
        if (remotePeerIds[conn.peer] === undefined) {
            // const playerSn = Object.keys(remotePeerIds).indexOf(conn.peer) + 1;
            const playerSn = Object.keys(remotePeerIds).length + 1;
            send(['msg', `猜測者 ${playerSn} 連入`], `猜測者 ${playerSn} 連入`, null, conn.peer);
        }
        remotePeerIds[conn.peer] = conn;
    } else {
        const conn = peer.connect(idOrConn);
        conn.on('open', () => {
            remotePeerIds[conn.peer] = conn;
            conn.on('data', receiveData);
        });
    }
    save();
}
