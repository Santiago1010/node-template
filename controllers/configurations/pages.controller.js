// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const PagesServices = require('../../services/configurations/pages.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// PageController
// =============================================================================

class PageController {
  /**
   * Creates a new page
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created page
   */
  static async createPage(req, res, next) {
    try {
      const { hostId, pageId, name, path, description, level, requiresAuthorization, hasSensitiveInformation } =
        req.body;

      const pagesService = new PagesServices();
      await pagesService.initialize();

      const newpage = await pagesService.createPage(hostId, name, path, {
        pageId,
        description,
        level,
        requiresAuthorization,
        hasSensitiveInformation,
        actor: req.user,
      });

      return await success(res, { httpCode: 201, messagePath: 'page.created', data: newpage });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more pages
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updatePagesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;

      const pagesService = new PagesServices();
      await pagesService.initialize();

      const result = await pagesService.updatePagesStatus(ids, active, { actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'pages.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of pages with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated pages
   */
  static async getListPages(req, res, next) {
    try {
      const pagesService = new PagesServices();
      await pagesService.initialize();

      const result = await pagesService.getListPages(req.query);

      return await success(res, { httpCode: 200, messagePath: 'pages.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific page by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with page details
   */
  static async getPageDetails(req, res, next) {
    try {
      const { id } = req.params;

      const pagesService = new PagesServices();
      await pagesService.initialize();

      const page = await pagesService.getPageDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'page.details', data: page });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing page
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated page
   */
  static async updatePage(req, res, next) {
    try {
      const { id } = req.params;
      const { hostId, pageId, name, path, description, level, requiresAuthorization, hasSensitiveInformation, active } =
        req.body;

      const pagesService = new PagesServices();
      await pagesService.initialize();

      const updatedpage = await pagesService.updatePage(id, {
        hostId,
        pageId,
        name,
        path,
        description,
        level,
        requiresAuthorization,
        hasSensitiveInformation,
        active,
        actor: req.user,
      });

      return await success(res, { httpCode: 200, messagePath: 'page.updated', data: updatedpage });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a page by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deletePage(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;

      const pagesService = new PagesServices();
      await pagesService.initialize();

      const result = await pagesService.deletePage(id, { justification, actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'page.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = PageController;
