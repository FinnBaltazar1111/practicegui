// TSV to TXT converter for SMO TAS scripts
// Ported from https://github.com/xiivler/TSV-TAS

class Line {
  constructor(duration) {
    this.duration = duration;
    this.ls_x = [0];
    this.ls_y = [0];
    this.rs_x = [0];
    this.rs_y = [0];
    this.inputs = [];
  }

  static LS = true;
  static RS = false;

  static encode = {
    'a': 'KEY_A',
    'b': 'KEY_B',
    'x': 'KEY_X',
    'y': 'KEY_Y',
    'zr': 'KEY_ZR',
    'zl': 'KEY_ZL',
    'r': 'KEY_R',
    'l': 'KEY_L',
    'plus': 'KEY_PLUS',
    '+': 'KEY_PLUS',
    'minus': 'KEY_MINUS',
    '-': 'KEY_MINUS',
    'dp-l': 'KEY_DLEFT',
    'dp-r': 'KEY_DRIGHT',
    'dp-u': 'KEY_DUP',
    'dp-d': 'KEY_DDOWN',
    'm-ll': 'KEY_DLEFT',
    'm-rr': 'KEY_DRIGHT',
    'm-uu': 'KEY_DUP',
    'm-dd': 'KEY_DDOWN',
    'm-l': 'KEY_L;KEY_DLEFT',
    'm-r': 'KEY_L;KEY_DRIGHT',
    'm-u': 'KEY_L;KEY_DUP',
    'm-d': 'KEY_L;KEY_DDOWN',
    'm': 'KEY_L',
    'ls': 'KEY_LSTICK',
    'rs': 'KEY_RSTICK'
  };

  add(s) {
    // Interpolation
    if (s.includes('->')) {
      if (s.includes('ls(')) {
        this.addInterpolatedStick(Line.LS, s);
      }
      if (s.includes('rs(')) {
        this.addInterpolatedStick(Line.RS, s);
      }
    }
    // Loops
    else if (s.includes('/')) {
      if (s.endsWith('/')) {
        s += ' ';
      }
      const val = s.split('/');
      if (s.includes('ls(')) {
        this.ls_x = new Array(val.length).fill(0);
        this.ls_y = new Array(val.length).fill(0);
      }
      if (s.includes('rs(')) {
        this.rs_x = new Array(val.length).fill(0);
        this.rs_y = new Array(val.length).fill(0);
      }
      for (let i = 0; i < val.length; i++) {
        const input = val[i];
        if (input.includes('ls(')) {
          this.addStick(Line.LS, i, input);
        } else if (input.includes('rs(')) {
          this.addStick(Line.RS, i, input);
        }
        val[i] = Line.encode[input];
      }
      this.inputs.push(val);
    }
    // Single input
    else {
      if (s.includes('ls(')) {
        this.addStick(Line.LS, 0, s);
      } else if (s.includes('rs(')) {
        this.addStick(Line.RS, 0, s);
      } else {
        const str = Line.encode[s];
        if (str) {
          this.inputs.push([str]);
        }
      }
    }
  }

  addStick(stick, step, s) {
    s = s.substring(s.indexOf('(') + 1, s.indexOf(')'));
    let r = 1;
    let theta = 0;
    let x = 0;
    let y = 0;

    // Cartesian coordinates
    if (s.includes(',')) {
      const parts = s.split(',');
      x = parseInt(parts[0].trim());
      y = parseInt(parts[1].trim());
    }
    // Polar coordinates
    else {
      if (s.includes(';')) {
        const parts = s.split(';');
        r = parseFloat(parts[0].trim());
        theta = (parseFloat(parts[1].trim()) * Math.PI) / 180; // Convert to radians
      } else {
        theta = (parseFloat(s) * Math.PI) / 180; // Convert to radians
      }
      x = Math.trunc(32767 * r * Math.cos(theta));
      y = Math.trunc(32767 * r * Math.sin(theta));
    }

    if (stick === Line.LS) {
      this.ls_x[step] = x;
      this.ls_y[step] = y;
    } else {
      this.rs_x[step] = x;
      this.rs_y[step] = y;
    }
  }

  addInterpolatedStick(stick, s) {
    let angle1 = s.substring(0, s.indexOf('>') - 1).trim();
    let angle2 = s.substring(s.indexOf('>') + 1).trim();
    angle1 = angle1.substring(angle1.indexOf('(') + 1, angle1.indexOf(')'));
    angle2 = angle2.substring(angle2.indexOf('(') + 1, angle2.indexOf(')'));

    let r1 = 1;
    let r2 = 1;
    let theta1 = 0;
    let theta2 = 0;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    const x = new Array(this.duration);
    const y = new Array(this.duration);

    // Cartesian coordinates
    if (s.includes(',')) {
      x1 = parseInt(angle1.substring(0, angle1.indexOf(',')).trim());
      x2 = parseInt(angle2.substring(0, angle2.indexOf(',')).trim());
      y1 = parseInt(angle1.substring(angle1.indexOf(',') + 1).trim());
      y2 = parseInt(angle2.substring(angle2.indexOf(',') + 1).trim());

      let x_current = x1;
      let y_current = y1;
      const dx = (x2 - x1) / (this.duration - 1);
      const dy = (y2 - y1) / (this.duration - 1);

      for (let i = 0; i < this.duration - 1; i++) {
        x[i] = Math.trunc(x_current);
        x_current += dx;
      }
      x[this.duration - 1] = x2;

      for (let i = 0; i < this.duration - 1; i++) {
        y[i] = Math.trunc(y_current);
        y_current += dy;
      }
      y[this.duration - 1] = y2;
    }
    // Polar coordinates
    else {
      if (angle1.includes(';')) {
        const parts = angle1.split(';');
        r1 = parseFloat(parts[0].trim());
        theta1 = (parseFloat(parts[1].trim()) * Math.PI) / 180;
      } else {
        theta1 = (parseFloat(angle1) * Math.PI) / 180;
      }

      if (angle2.includes(';')) {
        const parts = angle2.split(';');
        r2 = parseFloat(parts[0].trim());
        theta2 = (parseFloat(parts[1].trim()) * Math.PI) / 180;
      } else {
        theta2 = (parseFloat(angle2) * Math.PI) / 180;
      }

      const dr = (r2 - r1) / (this.duration - 1);
      const dtheta = (theta2 - theta1) / (this.duration - 1);

      for (let i = 0; i < this.duration - 1; i++) {
        x[i] = Math.trunc(32767 * r1 * Math.cos(theta1));
        y[i] = Math.trunc(32767 * r1 * Math.sin(theta1));
        r1 += dr;
        theta1 += dtheta;
      }
      x[this.duration - 1] = Math.trunc(32767 * r2 * Math.cos(theta2));
      y[this.duration - 1] = Math.trunc(32767 * r2 * Math.sin(theta2));
    }

    if (stick === Line.LS) {
      this.ls_x = x;
      this.ls_y = y;
    } else {
      this.rs_x = x;
      this.rs_y = y;
    }
  }

  get(n) {
    let line = '';
    for (const input of this.inputs) {
      const s = input[n % input.length];
      if (s) {
        line += s + ';';
      }
    }
    if (line === '') {
      line += 'NONE ';
    } else {
      line = line.substring(0, line.length - 1) + ' ';
    }
    line += this.ls_x[n % this.ls_x.length] + ';' + this.ls_y[n % this.ls_y.length] + ' ';
    line += this.rs_x[n % this.rs_x.length] + ';' + this.rs_y[n % this.rs_y.length];
    return line;
  }

  isEmpty() {
    return this.get(0) === 'NONE 0;0 0;0';
  }
}

class TSVConverter {
  constructor(includeEmptyLines = false) {
    this.includeEmptyLines = includeEmptyLines;
    this.replace = {};
  }

  static mathPattern = /(-?[.\d]+) *([+-]) *(-?[.\d]+)/;
  static variablePattern = /\$\w*/g;

  prepareToken(token) {
    // Replace variables
    const variableMatches = token.match(TSVConverter.variablePattern);
    if (variableMatches) {
      for (const match of variableMatches) {
        if (this.replace[match]) {
          token = token.replace(match, this.replace[match]);
        }
      }
    }

    // Evaluate math expressions
    let mathMatch;
    while ((mathMatch = TSVConverter.mathPattern.exec(token))) {
      const num1 = parseFloat(mathMatch[1]);
      const num2 = parseFloat(mathMatch[3]);
      const isAdd = mathMatch[2] === '+';
      const total = isAdd ? num1 + num2 : num1 - num2;

      // If the total is an integer, write it as such
      const replacement = total === Math.floor(total) ? total.toString() : total.toString();
      token = token.replace(mathMatch[0], replacement);
    }

    return token.toLowerCase();
  }

  convert(tsvContent) {
    const lines = tsvContent.split('\n');
    const output = [];
    let lineNumber = 1;

    for (const rawLine of lines) {
      if (!rawLine.trim()) continue;

      const parts = rawLine.split('\t');
      let duration = 1;
      let startIndex = 0;

      // Check if first part is a duration
      if (parts.length > 0) {
        const firstPart = parts[0].trim();

        // Skip comments
        if (firstPart.startsWith('//')) {
          continue;
        }

        // Handle variable definitions
        if (firstPart.startsWith('$') && firstPart.includes('=')) {
          const eqIndex = firstPart.indexOf('=');
          const varName = firstPart.substring(0, eqIndex).trim();
          const varValue = this.prepareToken(firstPart.substring(eqIndex + 1).trim());
          this.replace[varName] = varValue;
          continue;
        }

        // Check if it's a duration number
        const parsedDuration = parseInt(firstPart);
        if (!isNaN(parsedDuration) && firstPart === parsedDuration.toString()) {
          duration = parsedDuration;
          startIndex = 1;
        }
      }

      const line = new Line(duration);

      // Process all inputs
      for (let i = startIndex; i < parts.length; i++) {
        const token = parts[i].trim();
        if (token) {
          try {
            line.add(this.prepareToken(token));
          } catch (err) {
            throw new Error(`Syntax error at line ${lineNumber}: ${err.message}`);
          }
        }
      }

      // Add frames to output
      if (!this.includeEmptyLines && line.isEmpty()) {
        lineNumber += duration;
      } else {
        for (let i = 0; i < duration; i++) {
          output.push(`${lineNumber} ${line.get(i)}`);
          lineNumber++;
        }
      }
    }

    return output.join('\n');
  }
}

module.exports = { TSVConverter, Line };