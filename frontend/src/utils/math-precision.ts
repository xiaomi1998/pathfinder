/**
 * 数学精确性工具库
 * 为拖拽功能提供亚像素级精确度的计算支持
 */

// 精度常量
export const PRECISION = {
  EPSILON: 1e-10,           // 浮点数精度阈值
  DECIMAL_PLACES: 8,        // 保留小数位数
  SUB_PIXEL: 0.001,        // 亚像素精度
  ANGLE_EPSILON: 1e-6,     // 角度精度
  MATRIX_EPSILON: 1e-9     // 矩阵计算精度
} as const;

/**
 * 高精度浮点数比较
 */
export function isEqual(a: number, b: number, epsilon = PRECISION.EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * 高精度数值四舍五入
 */
export function preciseRound(value: number, precision = PRECISION.DECIMAL_PLACES): number {
  const multiplier = Math.pow(10, precision);
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * 高精度二维向量类
 */
export class Vector2D {
  private _x: number;
  private _y: number;

  constructor(x = 0, y = 0) {
    this._x = preciseRound(x);
    this._y = preciseRound(y);
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }

  set x(value: number) { this._x = preciseRound(value); }
  set y(value: number) { this._y = preciseRound(value); }

  /**
   * 创建向量副本
   */
  clone(): Vector2D {
    return new Vector2D(this._x, this._y);
  }

  /**
   * 设置向量值
   */
  set(x: number, y: number): Vector2D {
    this._x = preciseRound(x);
    this._y = preciseRound(y);
    return this;
  }

  /**
   * 向量加法
   */
  add(vector: Vector2D): Vector2D {
    return new Vector2D(this._x + vector.x, this._y + vector.y);
  }

  /**
   * 向量减法
   */
  subtract(vector: Vector2D): Vector2D {
    return new Vector2D(this._x - vector.x, this._y - vector.y);
  }

  /**
   * 标量乘法
   */
  multiply(scalar: number): Vector2D {
    return new Vector2D(this._x * scalar, this._y * scalar);
  }

  /**
   * 标量除法
   */
  divide(scalar: number): Vector2D {
    if (Math.abs(scalar) < PRECISION.EPSILON) {
      throw new Error('Division by zero in Vector2D.divide');
    }
    return new Vector2D(this._x / scalar, this._y / scalar);
  }

  /**
   * 向量长度
   */
  length(): number {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }

  /**
   * 向量长度的平方
   */
  lengthSquared(): number {
    return this._x * this._x + this._y * this._y;
  }

  /**
   * 单位化向量
   */
  normalize(): Vector2D {
    const len = this.length();
    if (len < PRECISION.EPSILON) {
      return new Vector2D(0, 0);
    }
    return this.divide(len);
  }

  /**
   * 点积
   */
  dot(vector: Vector2D): number {
    return this._x * vector.x + this._y * vector.y;
  }

  /**
   * 叉积 (2D中返回标量)
   */
  cross(vector: Vector2D): number {
    return this._x * vector.y - this._y * vector.x;
  }

  /**
   * 向量距离
   */
  distanceTo(vector: Vector2D): number {
    return this.subtract(vector).length();
  }

  /**
   * 向量距离的平方
   */
  distanceToSquared(vector: Vector2D): number {
    return this.subtract(vector).lengthSquared();
  }

  /**
   * 向量角度 (弧度)
   */
  angle(): number {
    return Math.atan2(this._y, this._x);
  }

  /**
   * 两向量夹角 (弧度)
   */
  angleTo(vector: Vector2D): number {
    const dot = this.dot(vector);
    const cross = this.cross(vector);
    return Math.atan2(cross, dot);
  }

  /**
   * 向量旋转
   */
  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this._x * cos - this._y * sin,
      this._x * sin + this._y * cos
    );
  }

  /**
   * 线性插值
   */
  lerp(vector: Vector2D, t: number): Vector2D {
    t = Math.max(0, Math.min(1, t)); // 限制在 [0, 1] 范围内
    return new Vector2D(
      this._x + (vector.x - this._x) * t,
      this._y + (vector.y - this._y) * t
    );
  }

  /**
   * 向量相等比较
   */
  equals(vector: Vector2D, epsilon = PRECISION.EPSILON): boolean {
    return isEqual(this._x, vector.x, epsilon) && isEqual(this._y, vector.y, epsilon);
  }

  /**
   * 转换为简单对象
   */
  toObject(): { x: number; y: number } {
    return { x: this._x, y: this._y };
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return `Vector2D(${this._x.toFixed(3)}, ${this._y.toFixed(3)})`;
  }

  /**
   * 静态工厂方法
   */
  static from(obj: { x: number; y: number }): Vector2D {
    return new Vector2D(obj.x, obj.y);
  }

  static zero(): Vector2D {
    return new Vector2D(0, 0);
  }

  static one(): Vector2D {
    return new Vector2D(1, 1);
  }

  static up(): Vector2D {
    return new Vector2D(0, -1);
  }

  static down(): Vector2D {
    return new Vector2D(0, 1);
  }

  static left(): Vector2D {
    return new Vector2D(-1, 0);
  }

  static right(): Vector2D {
    return new Vector2D(1, 0);
  }
}

/**
 * 2D变换矩阵类
 */
export class Matrix2D {
  private elements: number[];

  constructor(
    a = 1, b = 0, c = 0,
    d = 0, e = 1, f = 0
  ) {
    this.elements = [
      preciseRound(a), preciseRound(b), preciseRound(c),
      preciseRound(d), preciseRound(e), preciseRound(f)
    ];
  }

  /**
   * 获取矩阵元素
   */
  get a(): number { return this.elements[0]; }
  get b(): number { return this.elements[1]; }
  get c(): number { return this.elements[2]; }
  get d(): number { return this.elements[3]; }
  get e(): number { return this.elements[4]; }
  get f(): number { return this.elements[5]; }

  /**
   * 矩阵克隆
   */
  clone(): Matrix2D {
    return new Matrix2D(
      this.a, this.b, this.c,
      this.d, this.e, this.f
    );
  }

  /**
   * 重置为单位矩阵
   */
  identity(): Matrix2D {
    this.elements = [1, 0, 0, 0, 1, 0];
    return this;
  }

  /**
   * 矩阵乘法
   */
  multiply(matrix: Matrix2D): Matrix2D {
    const a1 = this.a, b1 = this.b, c1 = this.c;
    const d1 = this.d, e1 = this.e, f1 = this.f;
    const a2 = matrix.a, b2 = matrix.b, c2 = matrix.c;
    const d2 = matrix.d, e2 = matrix.e, f2 = matrix.f;

    return new Matrix2D(
      a1 * a2 + b1 * d2,
      a1 * b2 + b1 * e2,
      a1 * c2 + b1 * f2 + c1,
      d1 * a2 + e1 * d2,
      d1 * b2 + e1 * e2,
      d1 * c2 + e1 * f2 + f1
    );
  }

  /**
   * 平移变换
   */
  translate(x: number, y: number): Matrix2D {
    const translation = Matrix2D.translation(x, y);
    return this.multiply(translation);
  }

  /**
   * 缩放变换
   */
  scale(x: number, y = x): Matrix2D {
    const scaling = Matrix2D.scaling(x, y);
    return this.multiply(scaling);
  }

  /**
   * 旋转变换
   */
  rotate(angle: number): Matrix2D {
    const rotation = Matrix2D.rotation(angle);
    return this.multiply(rotation);
  }

  /**
   * 应用变换到向量
   */
  transform(vector: Vector2D): Vector2D {
    return new Vector2D(
      this.a * vector.x + this.b * vector.y + this.c,
      this.d * vector.x + this.e * vector.y + this.f
    );
  }

  /**
   * 逆变换矩阵
   */
  invert(): Matrix2D {
    const det = this.determinant();
    if (Math.abs(det) < PRECISION.MATRIX_EPSILON) {
      throw new Error('Matrix is not invertible (determinant is zero)');
    }

    const invDet = 1 / det;
    return new Matrix2D(
      this.e * invDet,
      -this.b * invDet,
      (this.b * this.f - this.e * this.c) * invDet,
      -this.d * invDet,
      this.a * invDet,
      (this.d * this.c - this.a * this.f) * invDet
    );
  }

  /**
   * 计算行列式
   */
  determinant(): number {
    return this.a * this.e - this.b * this.d;
  }

  /**
   * 转换为CSS transform字符串
   */
  toCSSTransform(): string {
    return `matrix(${this.a}, ${this.d}, ${this.b}, ${this.e}, ${this.c}, ${this.f})`;
  }

  /**
   * 转换为SVG transform字符串
   */
  toSVGTransform(): string {
    return `matrix(${this.a} ${this.d} ${this.b} ${this.e} ${this.c} ${this.f})`;
  }

  /**
   * 静态工厂方法
   */
  static identity(): Matrix2D {
    return new Matrix2D();
  }

  static translation(x: number, y: number): Matrix2D {
    return new Matrix2D(1, 0, x, 0, 1, y);
  }

  static scaling(x: number, y = x): Matrix2D {
    return new Matrix2D(x, 0, 0, 0, y, 0);
  }

  static rotation(angle: number): Matrix2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix2D(cos, -sin, 0, sin, cos, 0);
  }
}

/**
 * 边界框类
 */
export class BoundingBox {
  private _min: Vector2D;
  private _max: Vector2D;

  constructor(min = Vector2D.zero(), max = Vector2D.zero()) {
    this._min = min.clone();
    this._max = max.clone();
    this.normalize();
  }

  get min(): Vector2D { return this._min.clone(); }
  get max(): Vector2D { return this._max.clone(); }
  get width(): number { return this._max.x - this._min.x; }
  get height(): number { return this._max.y - this._min.y; }
  get center(): Vector2D { return this._min.add(this._max).divide(2); }
  get area(): number { return this.width * this.height; }

  /**
   * 标准化边界框 (确保min < max)
   */
  private normalize(): void {
    if (this._min.x > this._max.x) {
      [this._min.x, this._max.x] = [this._max.x, this._min.x];
    }
    if (this._min.y > this._max.y) {
      [this._min.y, this._max.y] = [this._max.y, this._min.y];
    }
  }

  /**
   * 扩展边界框包含点
   */
  expandToInclude(point: Vector2D): BoundingBox {
    return new BoundingBox(
      new Vector2D(
        Math.min(this._min.x, point.x),
        Math.min(this._min.y, point.y)
      ),
      new Vector2D(
        Math.max(this._max.x, point.x),
        Math.max(this._max.y, point.y)
      )
    );
  }

  /**
   * 检查点是否在边界框内
   */
  contains(point: Vector2D): boolean {
    return point.x >= this._min.x && point.x <= this._max.x &&
           point.y >= this._min.y && point.y <= this._max.y;
  }

  /**
   * 检查边界框相交
   */
  intersects(other: BoundingBox): boolean {
    return !(other._max.x < this._min.x || other._min.x > this._max.x ||
             other._max.y < this._min.y || other._min.y > this._max.y);
  }

  /**
   * 获取相交区域
   */
  intersection(other: BoundingBox): BoundingBox | null {
    if (!this.intersects(other)) {
      return null;
    }

    return new BoundingBox(
      new Vector2D(
        Math.max(this._min.x, other._min.x),
        Math.max(this._min.y, other._min.y)
      ),
      new Vector2D(
        Math.min(this._max.x, other._max.x),
        Math.min(this._max.y, other._max.y)
      )
    );
  }

  /**
   * 添加边距
   */
  expand(margin: number): BoundingBox {
    return new BoundingBox(
      new Vector2D(this._min.x - margin, this._min.y - margin),
      new Vector2D(this._max.x + margin, this._max.y + margin)
    );
  }

  /**
   * 静态工厂方法
   */
  static fromPoints(points: Vector2D[]): BoundingBox {
    if (points.length === 0) {
      return new BoundingBox();
    }

    let min = points[0].clone();
    let max = points[0].clone();

    for (let i = 1; i < points.length; i++) {
      min.x = Math.min(min.x, points[i].x);
      min.y = Math.min(min.y, points[i].y);
      max.x = Math.max(max.x, points[i].x);
      max.y = Math.max(max.y, points[i].y);
    }

    return new BoundingBox(min, max);
  }

  static fromRect(x: number, y: number, width: number, height: number): BoundingBox {
    return new BoundingBox(
      new Vector2D(x, y),
      new Vector2D(x + width, y + height)
    );
  }
}

/**
 * 数学工具函数
 */
export const MathUtils = {
  /**
   * 线性插值
   */
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, t));
  },

  /**
   * 将值限制在指定范围内
   */
  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * 将值映射到新的范围
   */
  map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
    const normalized = (value - fromMin) / (fromMax - fromMin);
    return toMin + normalized * (toMax - toMin);
  },

  /**
   * 角度转弧度
   */
  degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
  },

  /**
   * 弧度转角度
   */
  radToDeg(radians: number): number {
    return radians * 180 / Math.PI;
  },

  /**
   * 计算两点间距离
   */
  distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 平滑步进函数
   */
  smoothStep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },

  /**
   * 更平滑的步进函数
   */
  smootherStep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
};