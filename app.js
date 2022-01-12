const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const axios = require('axios').default;
const FormData = require('form-data');

//Next step is to make a function to handle salesman folder assignment make functions to randomize possible client names and salesmen for further testing


//START_SEARCH needs to be the make a copy client folder will work regardless of content changes
const START_SEARCH = '1ejcKegCaKgsD-IKFx_Tnfq6F9_g73A_V';
const zohoLeadID = '23525235235';
let salesmen = {
    Jim: '18MNuOEyoqqXRNSki7RX7biWWVdSrcXv2',
    Mark: '1M6NUf-7m0lRfOtP_3ZuNtzA6KlzSjg37',
    Samantha: '1qEBWVWjh9rafF5YjP70VZSMzhoVBU5wJ'
};

let listSalesman = ['Jim', 'Mark', 'Samanth'];
let listName = ['Samantha Burgois', 'Kevin Lee', 'James Harden - Expansion', 'Sierra Bedoin exp', 'Cain valasquez', 'Ken Kesey', 'Amy Winehouse'];

function generateRandomName() {
    return listName[Math.floor((Math.random() * 6))];
}

function generateRandomSalesman() {
    let sales = listSalesman[Math.floor((Math.random() * 3))];
    if(sales === 'Samantha') {
        return salesmen.Samantha;
    } else if(sales === 'Mark') {
        return salesmen.Mark;
    } else {
        return salesmen.Jim;
    }

}

function authorize() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'creds.json',
        scopes: SCOPES
    })
    return google.drive({version: 'v3', auth})
}

function search(driveService, parentFolder) {
    return new Promise((resolve, reject) => {
        driveService.files.list({
            pageSize: 20,
            q: `'${parentFolder}' in parents and trashed = false`, 
            fields: 'files(id, name, mimeType)'
        }).then(({data}) => resolve(data))
        .catch(err => reject(err))
    })
}

function searchName(driveService, parentFolder, clientName) {
    return new Promise((resolve, reject) => {
        driveService.files.list({
            pageSize: 20,
            q: `'${parentFolder}' in parents and name='${clientName}'and mimeType='application/vnd.google-apps.folder' and trashed = false`, 
            fields: 'files(id, name, mimeType)'
        }).then(({data}) => resolve(data))
        .catch(err => reject(err))
    })
}

function createRoot(driveService, CLIENT_NAME, NEW_FOLDER_LOCATION) {
    let fileMetadata = {
        'name': CLIENT_NAME,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [NEW_FOLDER_LOCATION]
    }
    return new Promise((resolve, reject) => {
        const file = driveService.files.create({
            resource: fileMetadata,
            fields: 'id'
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })
}

function copy(driveService, copyContentId, contentNewName, root) {
    
    let fileMetadata = {
        'name': contentNewName,
        'parents': [root]
    };
    return new Promise((resolve, reject) => {
        const file = driveService.files.copy({
            'fileId': copyContentId,
            'resource': fileMetadata
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })
}

function create(driveService, contentNewName, root) {
    let fileMetadata = {
        'name': contentNewName,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [root]
    };
    return new Promise((resolve, reject) => {
        const file = driveService.files.create({
            resource: fileMetadata,
            fields: 'id'
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })

}

async function recursive(driveService, startSearch, rootFolder, clientName) {
    let children = await search(driveService, startSearch);
    if(children.files.length > 0) {
        for(let element of children.files) {
            if(element.mimeType === 'application/vnd.google-apps.folder') {
                let name = element.name.replace('Last, First', clientName);
                let folderID = await create(driveService, name, rootFolder);
                await recursive(driveService, element.id, folderID, clientName);
            } else {
            let name = element.name.replace('Last, First', clientName);
            let fileID = await copy(driveService, element.id, name, rootFolder);
            }
        }
    } 
}

function setNameFinal(clientName) {
    let clientNameLow = clientName.toLowerCase();
    if(clientNameLow.includes('- expansion') || clientNameLow.includes('- exp')) {
        return setNameExpansionEnd(clientName);
    } else if(clientNameLow.includes('expansion -') || clientNameLow.includes('exp -')) {
        return setNameExpansionBeginning(clientName)
    } else if(clientNameLow.includes(' expansion') || clientNameLow.includes(' exp')) {
        return setNameExpansionEndNoDash(clientName);
    } else if(clientNameLow.includes('expansion ') || clientNameLow.includes('exp ')) {
        return setNameExpansionBeginningNoDash(clientName);
    } else {
        return setName(clientName);
    }
}
function setName(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`;
    for(let i=0; i < (clientNameArray.length - 1); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    return clientNameNew;
}
function setNameExpansionEnd(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 3]},`;
    for(let i=0; i < (clientNameArray.length - 3); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;
}
function setNameExpansionBeginning(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`
    for(let i=2; i < (clientNameArray.length - 1); i++){
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;
}
function setNameExpansionEndNoDash(clientName){
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 2]},`;
    for(let i=0; i < (clientNameArray.length - 2); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;

}
function setNameExpansionBeginningNoDash(clientName) {
    const clientNameArray = clientName.split(' ');
    let clientNameNew = `${clientNameArray[clientNameArray.length - 1]},`
    for(let i=1; i < (clientNameArray.length - 1); i++) {
        clientNameNew += ` ${clientNameArray[i]}`;
    }
    clientNameNew += ' - Expansion';
    return clientNameNew;
}

async function postData(zohoLeadID, root) {
    var form = new FormData();
    form.append("arguments", JSON.stringify({"ID":`${zohoLeadID}`, "folderNumber": `https://drive.google.com/drive/u/2/folders/${root}`}));
    const axiosRes = await axios.post(
        'https://www.zohoapis.com/crm/v2/functions/customer_drive_folder/actions/execute?auth_type=apikey&zapikey=1003.ade4315e8f897383a459d32564f2c9d8.188fdb7cf0de752fbe595de592e9db15', form, {headers: form.getHeaders()}
    );
}

// async function run() {
//     try{
//         //let salesman = generateRandomSalesman();
//         //let CLIENT_NAME = generateRandomName();
//         let zohoLeadID = '5163559000000372030';
//         const google = await authorize();
//         //let clientName = setNameFinal(CLIENT_NAME);
//         let clientName = 'Moan, Bimbim';
//         let salesman = salesmen.Mark;
//         let folderQueryResult = await searchName(google, salesman, clientName);
//         //console.log(`${CLIENT_NAME} at ${salesman}`);

//         if(folderQueryResult.files.length <= 0) {
//             let root = await createRoot(google, clientName, salesman);
//             postData(zohoLeadID, root);
//             await recursive(google, START_SEARCH, root, clientName);

//         } else {
//             let root = folderQueryResult.files[0].id;
//             postData(zohoLeadID, root);
//         }

//     } catch(err) {
//         console.log('error', err);
//     }
// }

//run();


exports.main = async (req, res) => {

    try {

        const params = new URLSearchParams(req.body);
        let zohoLeadID = params.get('zohoLeadID');
        let salesman = params.get('salesman');
        let stringName = params.get('Name');
        console.log(`name: ${stringName}. zoho id: ${zohoLeadID}. salesman: ${salesman}.`);
        //let salesman = generateRandomSalesman();
        //let CLIENT_NAME = generateRandomName();
        //let zohoLeadID = '5163559000000372030';
        //const google = await authorize();
        //let clientName = setNameFinal(CLIENT_NAME);
        //let clientName = 'Moan, Bimbim';
        //let salesman = salesmen.Mark;
        //let folderQueryResult = await searchName(google, salesman, clientName);
        //console.log(`${CLIENT_NAME} at ${salesman}`);

        // if(folderQueryResult.files.length <= 0) {
        //     let root = await createRoot(google, clientName, salesman);
        //     postData(zohoLeadID, root);
        //     await recursive(google, START_SEARCH, root, clientName);

        // } else {
        //     let root = folderQueryResult.files[0].id;
        //     postData(zohoLeadID, root);
        // }
      
      res.status(200).send('Success');

    } catch (err) {
      console.log(err);
      res.status(500).send('Failed...');
    }

};

