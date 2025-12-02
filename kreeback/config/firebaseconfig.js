import admin from "firebase-admin";
import serviceAccount from "../kree.json";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;