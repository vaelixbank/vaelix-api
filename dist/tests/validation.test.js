"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../utils/validation");
describe('Validation Utils', () => {
    describe('validateEmail', () => {
        it('should validate correct email addresses', () => {
            expect((0, validation_1.validateEmail)('test@example.com')).toBe(true);
            expect((0, validation_1.validateEmail)('user.name+tag@example.co.uk')).toBe(true);
        });
        it('should reject invalid email addresses', () => {
            expect((0, validation_1.validateEmail)('invalid-email')).toBe(false);
            expect((0, validation_1.validateEmail)('test@')).toBe(false);
            expect((0, validation_1.validateEmail)('@example.com')).toBe(false);
        });
    });
    describe('validateUUID', () => {
        it('should validate correct UUIDs', () => {
            expect((0, validation_1.validateUUID)('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        });
        it('should reject invalid UUIDs', () => {
            expect((0, validation_1.validateUUID)('invalid-uuid')).toBe(false);
            expect((0, validation_1.validateUUID)('123e4567-e89b-12d3-a456')).toBe(false);
        });
    });
    describe('validateCurrency', () => {
        it('should validate correct currency codes', () => {
            expect((0, validation_1.validateCurrency)('USD')).toBe(true);
            expect((0, validation_1.validateCurrency)('EUR')).toBe(true);
            expect((0, validation_1.validateCurrency)('GBP')).toBe(true);
        });
        it('should reject invalid currency codes', () => {
            expect((0, validation_1.validateCurrency)('US')).toBe(false);
            expect((0, validation_1.validateCurrency)('USDD')).toBe(false);
            expect((0, validation_1.validateCurrency)('usd')).toBe(false);
        });
    });
    describe('validateAmount', () => {
        it('should validate correct amounts', () => {
            expect((0, validation_1.validateAmount)(100)).toBe(true);
            expect((0, validation_1.validateAmount)(99.99)).toBe(true);
            expect((0, validation_1.validateAmount)(0.01)).toBe(true);
        });
        it('should reject invalid amounts', () => {
            expect((0, validation_1.validateAmount)(0)).toBe(false);
            expect((0, validation_1.validateAmount)(-100)).toBe(false);
            expect((0, validation_1.validateAmount)(NaN)).toBe(false);
            expect((0, validation_1.validateAmount)(Infinity)).toBe(false);
        });
    });
});
