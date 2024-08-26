const AWS = require('aws-sdk');
const { ErrorResponse } = require('./response');
const { constants } = require('../utils/constants')
AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.region
});

const uploadFile = async (filename, body, mimeType) => {
    try{
        const s3 = new AWS.S3();
        let params = {
            Bucket: process.env.S3_BUCKET,
            Key: filename,
            Body: body,
            ContentType: mimeType,
        }
        let file = await s3.putObject(params).promise()
        console.log("file successfully uploaded")
    }
    catch(err){
        console.log("error uploading :"+err.message)
    }

}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Byte';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log2(bytes) / 10); // Using base-2 logarithm for better performance
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${sizes[i]}`;
}
const getFileMetadata = ({ originalname, mimetype, size }) => {
    return {
        size: formatFileSize(size),
        url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${originalname}`,
        mimeType: mimetype
    }
}

module.exports = {
    uploadFile,
    getFileMetadata
}