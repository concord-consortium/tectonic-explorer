import shajs from 'sha.js';

export const createHash = (obj: object): string => shajs('sha1').update(JSON.stringify(obj)).digest('hex');
