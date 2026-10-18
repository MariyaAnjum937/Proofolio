const ImageKit = require('@imagekit/nodejs');

let imagekit = null;

const getImageKitClient = () => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey || !urlEndpoint) {
    throw new Error('ImageKit configuration is missing. Provide IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_URL_ENDPOINT.');
  }

  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });
  }

  return imagekit;
};

module.exports = { getImageKitClient };