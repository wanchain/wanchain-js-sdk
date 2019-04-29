/**
 * Error defination
 *
 * Copyright (c) 2019, Wanchain.
 * Liscensed under MIT license.
 */

const _WERRNO_LOGIC_BASE          = 0x1000;
const _WERRNO_LOGIC_INVALID_PARAM = 0x1001;
const _WERRNO_LOGIC_WRONG_PASSWORD= 0x1002;
const _WERRNO_LOGIC_NOT_SUPPORT   = 0x1003;

const _WERRNO_RUNTIME_BASE    = 0x2000;
const _WERRNO_RUNTIME_TIMEOUT = 0x2001;
const _WERRNO_RUNTIME_NOTFOUND= 0x2002;
const _WERRNO_RUNTIME_NOTIMPL = 0x2003;
const _WERRNO_RUNTIME_DUPLICATE= 0x2004;

class WError extends Error {
    constructor(errno, msg) {
        super(msg);
        this.name = 'WError';
        this.errno= errno;
    }
};

class LogicError extends WError {
    constructor(msg, errno) {
        errno = errno ||_WERRNO_LOGIC_BASE
        super(errno, msg);
        this.name = 'LogicError';
    }
};

class RuntimeError extends WError {
    constructor(msg, errno) {
        errno = errno || _WERRNO_RUNTIME_BASE
        super(errno, msg);
        this.name = 'RuntimeError';
    }
};

class InvalidParameter extends LogicError {
    constructor(msg) {
        super(msg, _WERRNO_LOGIC_INVALID_PARAM);
        this.name = 'InvalidParameter';
    }
};

class WrongPassword extends LogicError {
    constructor(msg) {
        super(msg, _WERRNO_LOGIC_WRONG_PASSWORD);
        this.name = 'WrongPassword';
    }
};

class NotSupport extends LogicError {
    constructor(msg) {
        super(msg, _WERRNO_LOGIC_NOT_SUPPORT);
        this.name = 'NotSupport';
    }
};


class Timeout extends RuntimeError {
    constructor(msg) {
        super(msg, _WERRNO_RUNTIME_TIMEOUT);
        this.name = 'Timeout';
    }
};

class NotFound extends RuntimeError {
    constructor(msg) {
        super(msg, _WERRNO_RUNTIME_NOTFOUND);
        this.name = 'NotFound';
    }
};

class NotImplemented extends RuntimeError {
    constructor(msg) {
        super(msg, _WERRNO_RUNTIME_NOTIMPL);
        this.name = 'NotImplemented';
    }
};

class DuplicateRecord extends RuntimeError {
    constructor(msg) {
        super(msg, _WERRNO_RUNTIME_DUPLICATE);
        this.name = 'DuplicateRecord';
    }
};

function NewError(errno, msg) {
    return new WError(errno, msg);
}

module.exports = {
    WError,
    LogicError,
    RuntimeError,
    InvalidParameter,
    WrongPassword,
    NotSupport,
    DuplicateRecord,
    Timeout,
    NotFound,
    NotImplemented
};
