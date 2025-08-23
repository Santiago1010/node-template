class DocsGenerator {
  static standardRequest(type, { tags, description, operationId, parameters, requestBody, security, responses } = {}) {
    let requestObject = {};

    requestObject[type] = {
      tags,
      description,
      operationId,
      parameters,
      requestBody,
      security,
      responses,
    };

    return requestObject;
  }
}

module.exports = DocsGenerator;
