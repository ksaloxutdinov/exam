import { hash, compare } from "bcrypt";
import { createHmac } from "crypto";

class Cryptography {
    async encrypt (data) {
        return await hash(data, 12);
    }

    async decrypt (data, hashedData) {
        return await compare(data, hashedData);
    }

    hmacEncrypt (data, key) {
        return createHmac('sha256', key).update(data).digest('hex');
    }
}

export default Cryptography;