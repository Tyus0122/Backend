const AWS = require('aws-sdk');
const { ErrorResponse } = require('./response');
const { constants } = require('../utils/constants')
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.region
});
function generateUniqueFileName(originalName) {
    const fileExtension = originalName.split('.').pop(); // extract file extension
    const uniqueName = uuidv4(); // generate unique identifier
    return `${uniqueName}.${fileExtension}`;
}
const uploadFile = async (unqFileName, body, mimeType) => {
    try {
        const s3 = new AWS.S3();
        let params = {
            Bucket: process.env.S3_BUCKET,
            Key: unqFileName,
            Body: body,
            ContentType: mimeType,
        }
        let file = await s3.putObject(params).promise()
        console.log("file successfully uploaded")
    }
    catch (err) {
        console.log("error uploading :" + err.message)
    }

}
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Byte';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log2(bytes) / 10); // Using base-2 logarithm for better performance
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${sizes[i]}`;
}
const getFileMetadata = ({ unqFileName, originalname, mimetype, size }) => {
    return {
        size: formatFileSize(size),
        url: `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${unqFileName}`,
        mimeType: mimetype,
        fileName: originalname,
    }
}

const mongoId = (id) => {
    return new mongoose.mongo.ObjectId(id)
}

module.exports = {
    uploadFile,
    getFileMetadata,
    mongoId,
    generateUniqueFileName
}