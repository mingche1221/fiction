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
    msg('已連接到網路');
    localStorage.setItem(isLieBrarian ? 'peerId' : location.search.replace('?', ''), id);

    if (isLieBrarian) {
        document.querySelector('.link').innerText = location.href + '?' + id;
        if (localStorage.getItem('remotePeerIds')) {
            const savedIds = JSON.parse(localStorage.getItem('remotePeerIds'));
            savedIds.forEach(savedId => {
                peer.connect(savedId);
            });
        }
    } else {
        connectLieBrarian(lieBrarianPeerId);
    }
    document.querySelector('main').classList.add('ready');

});

peer.on('connection', conn => {
    if (isLieBrarian) {
        addPeer(conn);
    } else {
        msg('圖書館員已重新連線');
        connectLieBrarian(conn.peer);
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
                console.log(conn, conn.open)
                // const newConn = peer.connect(conn.peer);
                // remotePeers[conn.peer] = newConn;
                // newConn.on('data', receiveData);
                // newConn.on('open', () => {
                //     newConn.send(data);
                // });
                msg(`${features[peerfeatures[conn.peer]]}失去連線`);
            }
            if (callBack) callBack();
        }
    });
}

function addPeer(conn) {
    conn.on('open', () => {
        conn.on('data', data => {receiveData(data, conn)});
        conn.on('close', () => msg(`${features[peerfeatures[conn.peer]]}斷線`));
        conn.on('error', err => msg(`連線異常：${err.type}`));
        if (typeof remotePeers[conn.peer] === 'undefined') {
            if (typeof peerfeatures[conn.peer] === 'undefined') {
                const featuresKey = Object.keys(features);
                const used_features = new Set(Object.values(peerfeatures));
                const available_features = [...new Set(featuresKey.filter(x => !used_features.has(x)))];
                const random_index = Math.floor((Math.random() * available_features.length));
                const playerFeature = available_features[random_index];
                peerfeatures[conn.peer] = playerFeature;
            }
            send(['msg', `${features[peerfeatures[conn.peer]]}連入`], `${features[peerfeatures[conn.peer]]}連入`, null, conn.peer);
            document.querySelector('header > div').innerHTML = '<div class="state liebrarian-state"></div><hr>';
            Object.values(peerfeatures).forEach(features => {
                document.querySelector('header > div').innerHTML += `<div class="state ${features}-state"></div>`
            });
            send(['header', document.querySelector('header').innerHTML]);
        } else {
            remotePeers[conn.peer].close();
            send(['msg', `${features[peerfeatures[conn.peer]]}已重新連線`], `${features[peerfeatures[conn.peer]]}已重新連線`, null, conn.peer);
        }
        remotePeers[conn.peer] = conn;
        save();
    });
}

function connectLieBrarian(id) {
    const conn = peer.connect(id);

    conn.on('open', () => {
        if (typeof remotePeers[id] !== 'undefined') remotePeers[id].close();
        conn.on('data', receiveData);
        conn.on('close', () => msg('圖書館員斷線'));
        conn.on('error', err => msg(`連線異常：${err.type}`));
        remotePeers[id] = conn;
        send('connecting');
    });
}