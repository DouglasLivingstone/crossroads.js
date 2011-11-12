
    // Pattern Lexer ------
    //=====================

    patternLexer = crossroads.patternLexer = (function () {


        var ESCAPE_CHARS_REGEXP = /[\\.+*?\^$\[\](){}\/'#]/g, //match chars that should be escaped on string regexp
            UNNECESSARY_SLASHES_REGEXP = /\/$/g, //trailing slash
            OPTIONAL_SLASHES_REGEXP = /([:}]|\w(?=\/))\/?(:)/g, //slash between `::` or `}:` or `\w:`. $1 = before, $2 = after
            REQUIRED_SLASHES_REGEXP = /([:}])\/?(\{)/g, //used to insert slash between `:{` and `}{`

            REQUIRED_PARAMS_REGEXP = /\{([^}]+)\}/g, //match everything between `{ }`
            OPTIONAL_PARAMS_REGEXP = /:([^:]+):/g, //match everything between `: :`
            PARAMS_REGEXP = /(?:\{|:)([^}:]+)(?:\}|:)/g, //capture everything between `{ }` or `: :`

            //used to save params during compile (avoid escaping things that
            //shouldn't be escaped).
            SAVE_REQUIRED_PARAMS = '__CR_RP__',
            SAVE_OPTIONAL_PARAMS = '__CR_OP__',
            SAVE_REQUIRED_SLASHES = '__CR_RS__',
            SAVE_OPTIONAL_SLASHES = '__CR_OS__',
            SAVED_REQUIRED_REGEXP = new RegExp(SAVE_REQUIRED_PARAMS, 'g'),
            SAVED_OPTIONAL_REGEXP = new RegExp(SAVE_OPTIONAL_PARAMS, 'g'),
            SAVED_OPTIONAL_SLASHES_REGEXP = new RegExp(SAVE_OPTIONAL_SLASHES, 'g'),
            SAVED_REQUIRED_SLASHES_REGEXP = new RegExp(SAVE_REQUIRED_SLASHES, 'g'),

            SAVE_TOKEN_REGEXP = new RegExp(
                SAVE_REQUIRED_PARAMS + '|' +
                SAVE_OPTIONAL_PARAMS + '|' +
                SAVE_OPTIONAL_SLASHES + '|' +
                SAVE_REQUIRED_SLASHES, 'g');


        function captureVals(regex, pattern) {
            var vals = [], match;
            while (match = regex.exec(pattern)) {
                vals.push(match[1]);
            }
            return vals;
        }

        function getParamIds(pattern) {
            return captureVals(PARAMS_REGEXP, pattern);
        }

        function getRequiredParamsIds(pattern) {
            return captureVals(REQUIRED_PARAMS_REGEXP, pattern);
        }

        function getOptionalParamsIds(pattern) {
            return captureVals(OPTIONAL_PARAMS_REGEXP, pattern);
        }

        function getNextRequiredParameter(paramIds, values) {
            var paramId = paramIds.shift();
            var value = values[paramId];
            if (!value) throw new Error('Missing parameter "' + paramId + '"');
            return value;
        }

        function getNextOptionalParameter(paramIds, values) {
            var value = values[paramIds.shift()];
            return value? '/' + value : '';
        }

        function getOptionalSlash(token, offset, pattern) {
            var remainingPattern = pattern.substr(offset + token.length);
            if (remainingPattern === "" ||
                remainingPattern.indexOf('/') === 0 ||
                remainingPattern.search(SAVE_TOKEN_REGEXP) === 0)
            {
                return '';
            }
            return '/';
        }

        function composePath(pattern, values) {
            pattern = pattern || '';
            values = values || {};
            if (pattern) {
                var paramIds = getParamIds(pattern);
                pattern = tokenize(pattern);
                pattern = pattern.replace(SAVE_TOKEN_REGEXP, function(token, offset, pattern) {
                    switch (token) {
                        case SAVE_REQUIRED_PARAMS: return getNextRequiredParameter(paramIds, values) + getOptionalSlash(token, offset, pattern);
                        case SAVE_OPTIONAL_PARAMS: return getNextOptionalParameter(paramIds, values) + getOptionalSlash(token, offset, pattern);
                        case SAVE_REQUIRED_SLASHES: return '/';
                        case SAVE_OPTIONAL_SLASHES: return '';
                        default: throw new Error("Unexpected token");
                    }
                });
            }
            return pattern;
        }

        function compilePattern(pattern) {
            pattern = pattern || '';
            if (pattern) {
                pattern = pattern.replace(UNNECESSARY_SLASHES_REGEXP, '');
                pattern = tokenize(pattern);
                pattern = pattern.replace(ESCAPE_CHARS_REGEXP, '\\$&');
                pattern = untokenize(pattern);
            }
            return new RegExp('^'+ pattern + '/?$'); //trailing slash is optional
        }

        function tokenize(pattern) {
            //save chars that shouldn't be escaped
            pattern = pattern.replace(OPTIONAL_SLASHES_REGEXP, '$1'+ SAVE_OPTIONAL_SLASHES +'$2');
            pattern = pattern.replace(REQUIRED_SLASHES_REGEXP, '$1'+ SAVE_REQUIRED_SLASHES +'$2');
            pattern = pattern.replace(OPTIONAL_PARAMS_REGEXP, SAVE_OPTIONAL_PARAMS);
            return pattern.replace(REQUIRED_PARAMS_REGEXP, SAVE_REQUIRED_PARAMS);
        }

        function untokenize(pattern) {
            pattern = pattern.replace(SAVED_OPTIONAL_SLASHES_REGEXP, '\\/?');
            pattern = pattern.replace(SAVED_REQUIRED_SLASHES_REGEXP, '\\/');
            pattern = pattern.replace(SAVED_OPTIONAL_REGEXP, '([^\\/]+)?\/?');
            return pattern.replace(SAVED_REQUIRED_REGEXP, '([^\\/]+)');
        }

        function getParamValues(request, regexp, shouldTypecast) {
            var vals = regexp.exec(request);
            if (vals) {
                vals.shift();
                if (shouldTypecast) {
                    vals = typecastArrayValues(vals);
                }
            }
            return vals;
        }

        //API
        return {
            getParamIds : getParamIds,
            getOptionalParamsIds : getOptionalParamsIds,
            getParamValues : getParamValues,
            compilePattern : compilePattern,
            composePath : composePath
        };

    }());

