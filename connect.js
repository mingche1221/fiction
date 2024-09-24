var peer = new Peer(localStorage.getItem(isLieBrarian ? 'peerId' : location.search.replace('?', '')));

peer.on('disconnected', () => {
    peer.reconnect();
});

peer.on('error', err => {
    switch (err.type) {
        case 'unavailable-id':
            // localStorage.removeItem('peerId');
            break;
        case 'network':
            // msg('網路異常，請重整頁面');
            // document.querySelector('main').classList.add('disabled');
            send(['msg', 'network down']);
            break;
        default:
            msg(`${err.type} / ${err}`);
            break;
    }
});

peer.on('open', id => {
    localStorage.setItem(isLieBrarian ? 'peerId' : location.search.replace('?', ''), id);

    if (isLieBrarian) {
        document.querySelector('.link').innerText = location.href + '?' + id;
        if (localStorage.getItem('remotePeerIds')) {
            const savedIds = JSON.parse(localStorage.getItem('remotePeerIds'));
            savedIds.forEach(id => {
                addPeer(id);
            });
        }
    } else {
        connectLieBrarian(lieBrarianPeerId);
    }
    document.querySelector('main').classList.add('ready');
    msg('已連線到網路');

});

peer.on('connection', conn => {
    if (isLieBrarian) {
        addPeer(conn);
    } else {
        connectLieBrarian(conn.peer);
        msg('出題者已重新連線');
        conn.close();
    }
});

function send(data, message = null, callBack = null, ignoreId = null) {
    if (message) {
        msg(message)
    }
    Object.values(remotePeers).forEach(conn => {
        if (!ignoreId || conn.peer != ignoreId) {
            if (conn.open) {
                conn.send(data);
            } else {
                // const newConn = peer.connect(conn.peer);
                // remotePeers[conn.peer] = newConn;
                // newConn.on('data', receiveData);
                // newConn.on('open', () => {
                //     newConn.send(data);
                // });
                msg('與猜測者失去連線');
            }
            if (callBack) callBack();
        }
    });
}

function addPeer(idOrConn) {
    if (typeof idOrConn === 'object') {
        const conn = idOrConn;
        conn.on('data', data => {receiveData(data, conn)});
        conn.on('close', () => msg('猜測者斷線'));
        conn.on('error', err => msg(`連線異常：${err.type}`));
        if (typeof remotePeers[conn.peer] === 'undefined') {
            const playerSn = Object.keys(remotePeers).length + 1;
            send(['msg', `猜測者 ${playerSn} 連入`], `猜測者 ${playerSn} 連入`, null, conn.peer);
        } else {
            const playerSn = Object.keys(remotePeers).indexOf(conn.peer) + 1;
            remotePeers[conn.peer].close();
            send(['msg', `猜測者 ${playerSn} 已重新連線`], `猜測者 ${playerSn} 已重新連線`, null, conn.peer);
        }
        remotePeers[conn.peer] = conn;
        save();
    } else {
        const id = idOrConn;
        if (typeof remotePeers[id] !== 'undefined') remotePeers[id].close();
        const conn = peer.connect(id);
    }
}

function connectLieBrarian(id) {
    const conn = peer.connect(id);

    if (typeof remotePeers[id] !== 'undefined') remotePeers[id].close();

    conn.on('open', () => {
        send('connecting');
    });
    conn.on('data', receiveData);
    conn.on('close', () => msg('出題者斷線'));
    conn.on('error', err => msg(`連線異常：${err.type}`));

    remotePeers[id] = conn;
}