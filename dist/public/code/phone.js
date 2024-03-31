let peerId = document.getElementById('peer-id')
let buttonConnect = document.getElementById('connect')
let textboxIdPeer = document.getElementById('id-peer-to-call')
let localMicrophone = document.getElementById('audioplayer-microphone')
let callInProgress = document.getElementById('options-call')
let hungupCall = document.getElementById('hang-up-now')
let closeVideoCall = document.getElementById('close-call')
let incomingCalls = document.getElementById('incoming-call')
let acceptCall = document.getElementById('accept-call')
let rejectCall = document.getElementById('reject-call')
let createContactBoxPhone = document.getElementById('phone-number-contact')
let createContactBoxName = document.getElementById('name-contact')
let saveContact = document.getElementById('save-contact')
let dashboardContacts = document.getElementById('dashboard-contacts')
let dashboardCreateContacts = document.getElementById('create-contact')
let buttonCreateContact = document.getElementById('add-contact')
const videoElement = document.getElementById('video-element')
let loadAudio

checkIfContactListIsCreated()
countContacts(getContactList())
buttonCreateContact.onclick = () => dashboardCreateContacts.style.display = 'flex'
ICED()
saveContact.addEventListener('click', ()=> saveContactLocal())
function ICED() {
    fetch('/ice')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los datos del servidor');
            }
            return response.json();
        })
        .then(data => {
                ConnectionAndEventsCall(data)
        })
        .catch(error => {
            console.error('Error al realizar la petición:', error);
        });
}

const checkIfUserHasSetUpPhoneOnBrowser = () => {
    if (localStorage.getItem('phone') == null || localStorage.getItem('phone') == '') {
        document.getElementById('request-for-number').style.display = "flex"
        document.getElementById('register-phone-number').addEventListener('click', () => {
            let phone_number = document.getElementById('phone-number').value
            fetch('/register_phone_number', { method: 'post', body: phone_number })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al enviar los datos del servidor');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.exits) {
                        localStorage.setItem('phone', phone_number)
                        document.getElementById('request-for-number').style.display = "none"
                        alert('Genial! Registro exitoso')

                    } else {
                        alert('Lo sentimos, El teléfono no está habilitado para usar esta app')
                    }
                })
                .catch(error => {
                    console.error('Error al realizar la petición:', error);
                });
        })
    }
}
function updateInfoPeer(phone, hash) {
    let data = { phone: phone, hash: hash }
    fetch('/update_hash', { method: 'post', body: JSON.stringify(data), headers: { "Content-Type": "application/json" } })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al enviar los datos del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
        })
        .catch(error => {
            console.error('Error al realizar la petición:', error);
        });
}
checkIfUserHasSetUpPhoneOnBrowser()

function ConnectionAndEventsCall(STUN) {
    var userPhonePeer = new Peer({ config: { 'iceServers': STUN }, constraints: { audio: true, video: false } });
    userPhonePeer.on('open', function (id) {
        updateInfoPeer(localStorage.getItem('phone'), id)
        document.getElementById('header-contacts').style.backgroundColor = 'rgb(25, 132, 255)'
        document.getElementById('state-connection').innerText = 'Conectado'
    });
    userPhonePeer.on('close', () => { alert('closed') });
    userPhonePeer.on('call', (call) => {
        const getAudioLocally = async () => await cameraAndAudio()
        getAudioLocally().then((data_audio) => {
            incomingCalls.style.display = 'flex'
            acceptCall.onclick = () => {
                call.answer(data_audio)
                // receiving video from remote
                call.on('stream', (stream) => {
                    callInProgress.style.display = 'flex'
                    videoElement.srcObject = stream
                    localMicrophone.srcObject = stream
                })
                hungupCall.addEventListener('click', () => {
                    call.close()
                    callInProgress.style.display = 'none'
                })
                closeVideoCall.addEventListener('click', ()=> {
                    call.close()
                    callInProgress.style.display = 'none'
                })
                incomingCalls.style.display = 'none'
            }
            rejectCall.onclick = () => {
                call.close()
                incomingCalls.style.display = 'none'
            }

        }).catch((err) => alert('Error: ', err))
    });

    buttonConnect.addEventListener('click', () => {
        let phone = textboxIdPeer.value
        const requesting = async () => await fetch('/getHash', { method: 'post', body: phone })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al enviar los datos del servidor');
                }
                return response.json();
            })
            .then(data => {
                callInProgress.style.display = 'flex'
                return data
            })
            .catch(error => {
                console.error('Error al realizar la petición:', error);
            });
        requesting().then(data => {
            console.log(data)
            let hash = data.hash
            var conn = userPhonePeer.connect(hash);

            const audio = async () => await cameraAndAudio()
            audio().then((data_audio) => {
                let callToPerson = userPhonePeer.call(hash, data_audio)
                callToPerson.on('stream', (stream) => {
                    videoElement.srcObject = stream
                    localMicrophone.srcObject = stream
                })
                hungupCall.addEventListener('click', () => {
                    callToPerson.close()
                    callInProgress.style.display = 'none'
                })
                closeVideoCall.addEventListener('click', ()=> {
                    callToPerson.close()
                    callInProgress.style.display = 'none'
                })
            }).catch((err) => console.log('Err: ', err))
        }).catch((error) => console.log("Error: ", error))
    })
}
function cameraAndAudio() {
    if (!navigator.mediaDevices && !navigator.mediaDevices.getUserMedia) {
        alert('Browser does not support for camera/audio')
        return
    }
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            return stream
        })
        .catch((err) => console.error(err))
}
function saveContactLocal() {

    let contactName = createContactBoxName.value
    let contactPhone = createContactBoxPhone.value
    if (contactName != '' && contactPhone != '') {
        let contact = {'contactPhone': contactPhone, 'contactName': contactName}
        let temporalContactList = getContactList()
        temporalContactList.push(contact)
        updateContactList(JSON.stringify(temporalContactList))
        countContacts(temporalContactList)
        dashboardCreateContacts.style.display = 'none'
        createContactBoxName.value = ''
        createContactBoxPhone.value = ''
    }
}
function checkIfContactListIsCreated() {
    if(localStorage.getItem('contactListPhone') == null) {
        const contacts = []
        localStorage.setItem('contactListPhone', JSON.stringify(contacts))
    }
}
function getContactList() {
    return JSON.parse(localStorage.getItem('contactListPhone'))
}
function updateContactList(newContactList) {
    localStorage.setItem('contactListPhone', newContactList)
}
function countContacts(contacts = []) {
    deleteContactDashboard()
    for(var i = 0; i < contacts.length; i++) {
        createElementForContacts(contacts[i].contactName, contacts[i].contactPhone, i)
    }
}
function createElementForContacts(nameForContacts, phoneForContacts, index) {
    let containerContactsView = document.createElement('div') 
    let containerContacts = document.createElement('div')
    let containerIcon = document.createElement('i') 
    let containerName = document.createElement('h3')
    let containerPhone = document.createElement('h3')
    let containerButtonCall = document.createElement('button')
    
    containerContactsView.classList.add('view-contacts')
    containerContacts.classList.add('contact')
    containerIcon.classList.add('fas')
    containerIcon.classList.add('fa-address-card')

    containerButtonCall.onclick = () => {
        textboxIdPeer.value = phoneForContacts
        buttonConnect.click()
    }
    containerIcon.onclick = () => deleteSpecificContact(index)

    containerName.innerHTML = nameForContacts
    containerPhone.innerHTML = phoneForContacts
    containerButtonCall.innerHTML = 'Llamar'

    containerContacts.appendChild(containerIcon)
    containerContacts.appendChild(containerName)
    containerContacts.appendChild(containerPhone)
    containerContacts.appendChild(containerButtonCall)

    containerContactsView.appendChild(containerContacts)
    dashboardContacts.appendChild(containerContactsView)
}
function deleteSpecificContact(index) {
    console.log(getContactList())
    let contacts = getContactList()
    contacts.splice(index, 1)
    countContacts(contacts)
    updateContactList(JSON.stringify(contacts))
}
function deleteContactDashboard() {
    if(dashboardContacts.children.length > 1) {
        for(var i = 0; i < dashboardContacts.childNodes.length; i++) {
            dashboardContacts.removeChild(dashboardContacts.lastChild)
        }
    }
}
