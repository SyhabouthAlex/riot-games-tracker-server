const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordLengthRegex = /^.{8,}$/;
const passwordCharactersRegex = /^([0-9a-zA-Z!@#$%^&*]).{8,}$/;

module.exports = {
    validateRegisterInput: (username, email, password, confirmPassword) => {
        const errors = {};
        if (username.trim().length === 0) errors.username = "Username cannot be blank";
        if (!emailRegex.test(email)) errors.email = "Invalid email";
        if (!passwordLengthRegex.test(password)) errors.password = "Password must be at least 8 characters"
        else if (!passwordCharactersRegex.test(password)) errors.password = "Password can only contain alphanumeric or special characters"
        else if (password !== confirmPassword) errors.confirmPassword = "Passwords must match"

        return {
            errors,
            valid: Object.keys(errors).length === 0
        }
    },
    validateLoginInput: (username, password) => {
        const errors = {};
        if (username.trim().length === 0) errors.username = "Username cannot be blank";
        if (password.trim().length === 0) errors.password = "Password cannot be blank";

        return {
            errors,
            valid: Object.keys(errors).length === 0
        }
    }
}