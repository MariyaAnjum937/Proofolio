const { getImageKitClient } = require('./imagekit.services');

const getSignedCertificateUrl = (certificate, expiresIn = 3600) => {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint || !certificate.certificateUrl) {
    return null;
  }

  let src = certificate.certificateFilePath;
  if (!src) {
    try {
      const storedUrl = new URL(certificate.certificateUrl);
      const imageKitEndpoint = new URL(endpoint);
      if (storedUrl.origin !== imageKitEndpoint.origin) {
        console.warn('Cannot sign a certificate URL from an unconfigured storage origin.');
        return null;
      }
      src = storedUrl.pathname;
    } catch (error) {
      console.warn('Cannot sign an invalid stored certificate URL.');
      return null;
    }
  }

  try {
    const imagekit = getImageKitClient();
    return imagekit.helper.buildSrc({
      src,
      urlEndpoint: endpoint,
      signed: true,
      expiresIn
    });
  } catch (error) {
    console.error('Failed to create a signed certificate URL:', error.message);
    return null;
  }
};

const withSignedCertificateUrl = (certificate, expiresIn = 3600) => {
  const result = typeof certificate.toObject === 'function'
    ? certificate.toObject()
    : { ...certificate };
  const signedUrl = getSignedCertificateUrl(result, expiresIn);

  return {
    ...result,
    certificateUrl: signedUrl,
    certificateFileId: undefined,
    certificateFilePath: undefined
  };
};

module.exports = { getSignedCertificateUrl, withSignedCertificateUrl };
