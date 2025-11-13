// Polyfills for Hermes engine compatibility
if (typeof global !== "undefined") {
  // Fix for _toString error in Hermes
  if (!global._toString) {
    global._toString = function (obj: any) {
      try {
        if (obj === null) return "null";
        if (obj === undefined) return "undefined";
        if (typeof obj === "string") return obj;
        if (typeof obj === "number") return obj.toString();
        if (typeof obj === "boolean") return obj.toString();
        if (obj instanceof Date) return obj.toLocaleString();
        if (typeof obj === "object") {
          try {
            return JSON.stringify(obj);
          } catch (e) {
            return "[object Object]";
          }
        }
        return String(obj);
      } catch (error) {
        console.warn("_toString error:", error);
        return "[object Object]";
      }
    };
  }

  // Additional Hermes compatibility fixes
  if (!global.Error.prototype.toString) {
    global.Error.prototype.toString = function () {
      return this.name + ": " + this.message;
    };
  }
}

// Ensure Date.prototype methods are available
if (typeof Date.prototype.toLocaleString !== "function") {
  Date.prototype.toLocaleString = function () {
    return (
      this.getFullYear() +
      "-" +
      String(this.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(this.getDate()).padStart(2, "0") +
      "T" +
      String(this.getHours()).padStart(2, "0") +
      ":" +
      String(this.getMinutes()).padStart(2, "0") +
      ":" +
      String(this.getSeconds()).padStart(2, "0") +
      "." +
      String(this.getMilliseconds()).padStart(3, "0") +
      "Z"
    );
  };
}

export {};
