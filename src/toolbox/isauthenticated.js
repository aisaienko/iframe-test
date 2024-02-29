import getCustomer from './data'

export default function isAuthenticated() {
    return new Promise((resolve, reject) => {
        if (!window.pymChild) {
            reject(new Error('pym object is not available'));
        }
        pymChild.onMessage('parent:isauthenticated', (message) => {
            let eventObject;
            try {
                eventObject = JSON.parse(message);
            } catch {
                eventObject = {};
            }
            const {loggedIn, emailId} = eventObject;
            if (!loggedIn || !emailId) {
                return resolve(false);
            }
            return getCustomer().then(customer => digestMessage(customer.email).then((currentEmailHash) => {
                return resolve(currentEmailHash === emailId)
            }))
        });
        pymChild.sendMessage('iframe:isauthenticated');
    });
}

async function digestMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((bytes) => bytes.toString(16).padStart(2, '0'))
            .join('');
        return hashHex;
    });
    return hash;
}