// =============================================================================
// VALIDATION FACTORY
// =============================================================================
// Factory class that generates an `express-validator` compatible `schema`
// object (used by `checkSchema`).
//
// Designed to meet the requirements of the previous factory while integrating
// with the CommonJS project style nd centralized internationalization.
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../../config/i18n');
const { cerror } = require('../debug.helper');

/**
 * ValidatorFactory
 *
 * Design:
 * - Returns a field-specific `schema` object that can be passed directly to `checkSchema({ field: schema })`.
 * - Groups sanitizers and validators, supports synchronous and asynchronous validations (DB checks).
 * - Supports options like `required`, `allowNull`, `nullableEmpty`, `optionalWhen` (runtime evaluated),
 *   `minLength`/`maxLength`, `min`/`max`, `pattern`, `onlyAlpha`, `inArray`/`values`, `formatter`
 *   (`trim`|`lowercase`|`uppercase`|`custom`), `toInt`, `toBoolean`, `customValidators` (array),
 *   and generic DB checks (`model`, `field`, `valid: 'exist'|'unique'`, `paranoid`, `dbCheckFn`).
 *
 * Security:
 * - DB checks use `model.findOne({ where: { [field]: value }, paranoid })` without SQL concatenation.
 * - Throws runtime Error if `options.model` doesn't provide `findOne`.
 * - Async validators handle exceptions and return controlled errors (i18n messages).
 *
 * Usage:
 *   const vf = new ValidatorFactory('name', 'body', options);
 *   const schemaFragment = vf.build();
 *
 * NOTE: This file exports the class; integration with express-validator (e.g., `checkSchema`) remains
 * in the location where global schemas are built.
 *
 * @example (in comments, not executable code)
 * // checkSchema({ name: new ValidatorFactory('name','body', opts).build() })
 *
 * @param {string} field - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Detailed options (see constructor JSDoc).
 */
class ValidatorFactory {
  /**
   * @typedef ValidatorOptions
   * @property {boolean} [required] - Requires existence and non-empty value if true.
   * @property {boolean} [allowNull] - Allows null values and skips additional validations if true.
   * @property {boolean} [nullableEmpty] - Treats '' as null/tolerable when allowNull=true.
   * @property {boolean} [optional] - Marks field as optional (static).
   * @property {(req: any) => boolean} [optionalWhen] - Runtime evaluated; field considered optional if true.
   * @property {string[]} [inArray] / [values] - Enum of accepted values.
   * @property {number} [minLength]
   * @property {number} [maxLength]
   * @property {number} [min]
   * @property {number} [max]
   * @property {RegExp|string} [pattern] - Regex for strings.
   * @property {boolean} [onlyAlpha] - Only Unicode letters, spaces, hyphens/apostrophes.
   * @property {'trim'|'lowercase'|'uppercase'|'custom'} [formatter]
   * @property {(val:any)=>any} [formatterFn] - if formatter === 'custom'
   * @property {boolean} [toInt]
   * @property {boolean} [toBoolean]
   * @property {boolean} [escape]
   * @property {Array<{ name?:string, fn: (value, meta)=>Promise<boolean|string|void>, message?:string }>} [customValidators]
   * @property {Object} [model] - ORM-like model with findOne({ where, paranoid })
   * @property {string} [field] - Table field name (defaults to constructor field)
   * @property {'exist'|'unique'} [valid] - DB check type
   * @property {boolean} [paranoid] - Passed to findOne
   * @property {(value, ctx) => Promise<boolean|string>} [dbCheckFn] - Alternative DB check function
   * @property {string} [errorMessage] - Global message overriding default messages.
   * @property {Function} [t] - i18n function (if not using i18n.__mf)
   */

  constructor(field, location = 'body', options = {}) {
    if (!field || typeof field !== 'string') {
      throw new TypeError('ValidatorFactory: "field" must be a non-empty string');
    }
    this.field = field;
    this.location = location;
    this.options = options || {};
    this.translatedField =
      typeof this.options.t === 'function'
        ? this.options.t('fields.' + field, { field })
        : i18n.__mf('fields.' + field);

    this.t = typeof this.options.t === 'function' ? this.options.t : (k, vars) => i18n.__mf(k, vars);

    this.options = this.options || {};
    this.schema = {
      in: location,
      optional: this.computeOptional(),
      notEmpty: this.getNotEmpty(),
      errorMessage: undefined,
      ...this.getTypeSpecificValidations(),
    };

    if (typeof this.options.errorMessage === 'string') {
      this.schema.errorMessage = this.options.errorMessage;
    }
  }

  computeOptional() {
    const { optional = false } = this.options;
    if (typeof this.options.optionalWhen === 'function') {
      return false;
    }
    if (optional) {
      return { options: { nullable: !!this.options.allowNull, checkFalsy: false } };
    }
    return false;
  }

  getNotEmpty() {
    const { nullableEmpty, allowNull } = this.options;
    if (this.options.optional && !this.options.emptyConditional) return undefined;

    if (this.options.required) {
      const msg = this.i18nMsg('validations.required', { field: this.translatedField });
      if (typeof this.options.emptyConditional === 'function') {
        return {
          if: this.options.emptyConditional,
          errorMessage: msg,
        };
      }
      if (allowNull && nullableEmpty) {
        return undefined;
      }
      return { errorMessage: msg };
    }
    return undefined;
  }

  i18nMsg(key, params = {}) {
    try {
      if (typeof this.options.t === 'function') {
        return this.options.t(key, { field: this.translatedField, ...params });
      }
      return i18n.__mf(key, { field: this.translatedField, ...params });
    } catch (err) {
      cerror(err);
      return `${this.translatedField} validation failed`;
    }
  }

  getTypeSpecificValidations() {
    const opts = this.options || {};
    const s = {};

    if (opts.formatter === 'trim' || typeof opts.formatter === 'undefined') {
      s.trim = true;
    }
    if (opts.formatter === 'lowercase') {
      s.customSanitizer = s.customSanitizer || {};
      if (!s.customSanitizer.options) {
        s.customSanitizer.options = (v) => (typeof v === 'string' ? v.toLowerCase() : v);
      }
    } else if (opts.formatter === 'uppercase') {
      s.customSanitizer = s.customSanitizer || {};
      if (!s.customSanitizer.options) {
        s.customSanitizer.options = (v) => (typeof v === 'string' ? v.toUpperCase() : v);
      }
    } else if (opts.formatter === 'custom' && typeof opts.formatterFn === 'function') {
      s.customSanitizer = s.customSanitizer || {};
      s.customSanitizer.options = opts.formatterFn;
    }

    if (opts.toInt) s.toInt = true;
    if (opts.toBoolean) s.toBoolean = true;
    if (opts.escape) s.escape = true;

    const allowedValues = Array.isArray(opts.inArray) ? opts.inArray : Array.isArray(opts.values) ? opts.values : null;
    if (allowedValues && allowedValues.length) {
      s.isIn = {
        options: [allowedValues],
        errorMessage: this.i18nMsg('validations.enum', { field: this.translatedField }),
      };
    }

    const needStringChecks =
      typeof opts.minLength === 'number' || typeof opts.maxLength === 'number' || opts.pattern || opts.onlyAlpha;
    if (needStringChecks) {
      s.isString = {
        errorMessage: this.i18nMsg('validations.type.string', { field: this.translatedField }),
      };

      if (typeof opts.minLength === 'number' || typeof opts.maxLength === 'number') {
        s.isLength = {
          options: { min: opts.minLength || 0, max: typeof opts.maxLength === 'number' ? opts.maxLength : undefined },
          errorMessage: this.i18nMsg('validations.lengthBetween', {
            field: this.translatedField,
            min: opts.minLength || 0,
            max: typeof opts.maxLength === 'number' ? opts.maxLength : '∞',
          }),
        };
      }

      if (opts.pattern) {
        let re = null;
        if (opts.pattern instanceof RegExp) re = opts.pattern;
        else {
          try {
            re = new RegExp(String(opts.pattern));
          } catch (e) {
            cerror(`ValidatorFactory: invalid pattern "${opts.pattern}"`, e);
            re = null;
          }
        }
        if (re) {
          s.matches = {
            options: re,
            errorMessage: this.i18nMsg('validations.pattern', { field: this.translatedField }),
          };
        }
      }

      if (opts.onlyAlpha) {
        s.matches = s.matches || {};
        s.matches.options = s.matches.options || /^[\p{L}\s'-]+$/u;
        s.matches.errorMessage =
          s.matches.errorMessage || this.i18nMsg('validations.type.alpha', { field: this.translatedField });
      }
    }

    if (typeof opts.min === 'number' || typeof opts.max === 'number') {
      if (opts.toInt) {
        s.isInt = {
          errorMessage: this.i18nMsg('validations.type.integer', { field: this.translatedField }),
        };
        const intOpts = {};
        if (typeof opts.min === 'number') intOpts.min = Math.trunc(opts.min);
        if (typeof opts.max === 'number') intOpts.max = Math.trunc(opts.max);
        if (Object.keys(intOpts).length) {
          s.isInt.options = intOpts;
          s.isInt.errorMessage = this.i18nMsg('validations.range', {
            field: this.translatedField,
            min: intOpts.min,
            max: intOpts.max,
          });
        }
      } else {
        s.isFloat = {
          errorMessage: this.i18nMsg('validations.type.number', { field: this.translatedField }),
        };
        const fOpts = {};
        if (typeof opts.min === 'number') fOpts.min = opts.min;
        if (typeof opts.max === 'number') fOpts.max = opts.max;
        if (Object.keys(fOpts).length) {
          s.isFloat.options = fOpts;
          s.isFloat.errorMessage = this.i18nMsg('validations.range', {
            field: this.translatedField,
            min: fOpts.min,
            max: fOpts.max,
          });
        }
      }
    }

    const combinedChecks = this.buildCombinedCustom();
    if (combinedChecks) {
      s.custom = {
        options: combinedChecks,
        errorMessage: this.options.errorMessage || this.i18nMsg('validations.custom', { field: this.translatedField }),
      };
    }

    return s;
  }

  buildCombinedCustom() {
    const opts = this.options || {};
    const hasOptionalWhen = typeof opts.optionalWhen === 'function';
    const hasAllowNull = !!opts.allowNull;
    const hasCustomValidators = Array.isArray(opts.customValidators) && opts.customValidators.length > 0;
    const hasDbCheck = !!(opts.model && opts.valid);

    if (!hasOptionalWhen && !hasAllowNull && !hasCustomValidators && !hasDbCheck) {
      return null;
    }

    const fieldName = this.field;
    const translated = this.translatedField;
    const t = (key, params) => this.i18nMsg(key, params);

    const defaultDbCheck = async (value, _) => {
      if (!opts.model || typeof opts.model.findOne !== 'function') {
        throw new Error(`ValidatorFactory DB check requires model.findOne (field: ${fieldName})`);
      }
      const whereField = opts.field || fieldName;
      const where = { [whereField]: value };
      try {
        const found = await opts.model.findOne({ where, paranoid: opts.paranoid ?? false });
        if (opts.valid === 'exist') {
          if (!found)
            throw new Error(t('validations.db.exist', { field: translated }) || `${translated} does not exist`);
        } else if (opts.valid === 'unique') {
          if (found)
            throw new Error(t('validations.db.unique', { field: translated }) || `${translated} must be unique`);
        } else {
          throw new Error(`ValidatorFactory: unsupported options.valid "${opts.valid}"`);
        }
        return true;
      } catch (err) {
        if (err instanceof Error) throw new Error(err.message || 'DB validation failed');
        throw new Error(String(err));
      }
    };

    return async (value, meta) => {
      const { req } = meta;
      if (hasOptionalWhen) {
        try {
          const optionalNow = !!opts.optionalWhen(req);
          if (optionalNow) {
            if (typeof value === 'undefined') return true;
            if (value === null && opts.allowNull) return true;
            if (value === '' && opts.nullableEmpty) return true;
          }
        } catch (err) {
          cerror('Optional when', `Error checking optional when: ${err.message}`);
        }
      }

      if (hasAllowNull && value === null) {
        return true;
      }
      if (hasAllowNull && opts.nullableEmpty && value === '') {
        return true;
      }

      if (hasCustomValidators) {
        for (const cv of opts.customValidators) {
          if (!cv || typeof cv.fn !== 'function') continue;
          try {
            const res = await cv.fn(value, meta);
            if (typeof res === 'undefined' || res === true) {
              continue;
            }
            if (res === false) {
              const msg =
                cv.message ||
                t('validations.custom', { field: translated }) ||
                `${translated} failed custom validation`;
              throw new Error(msg);
            }
            if (typeof res === 'string') {
              throw new Error(res);
            }
          } catch (err) {
            if (err instanceof Error) throw new Error(err.message);
            throw new Error(String(err));
          }
        }
      }

      if (hasDbCheck) {
        if (typeof opts.dbCheckFn === 'function') {
          try {
            const res = await opts.dbCheckFn(value, {
              model: opts.model,
              field: opts.field || fieldName,
              options: opts,
              req,
            });
            if (res === true || typeof res === 'undefined') return true;
            if (res === false) {
              const msg =
                opts.valid === 'exist'
                  ? t('validations.db.exist', { field: translated })
                  : t('validations.db.unique', { field: translated });
              throw new Error(msg);
            }
            if (typeof res === 'string') throw new Error(res);
            return true;
          } catch (err) {
            if (err instanceof Error) throw new Error(err.message);
            throw new Error(String(err));
          }
        }
        return defaultDbCheck(value, meta);
      }

      return true;
    };
  }

  addValidation(validatorName, options, errorKey, params = {}) {
    this.schema[validatorName] = {
      ...options,
      bail: true,
      errorMessage: this.i18nMsg(`validations.${errorKey}`, { ...params }),
    };
    return this;
  }

  addCustomValidation(validatorFn, errorKey, params = {}) {
    this.schema.custom = {
      options: validatorFn,
      errorMessage: this.i18nMsg(`validations.${errorKey}`, { ...params }),
    };
    return this;
  }

  addSanitizer(sanitizerName, options) {
    if (sanitizerName === 'toInt') {
      this.schema.toInt = true;
      return this;
    }

    if (sanitizerName === 'customSanitizer') {
      if (typeof options === 'function') {
        this.schema.customSanitizer = { options };
      } else {
        this.schema.customSanitizer = options || { options: (value) => value };
      }
      return this;
    }

    if (typeof options === 'object' && Object.keys(options).length === 0) {
      this.schema[sanitizerName] = true;
    } else {
      this.schema[sanitizerName] = { options };
    }

    return this;
  }

  build() {
    return this.schema;
  }
}

module.exports = ValidatorFactory;
