type DatabaseRow = import("mysql2/promise").RowDataPacket;
type DatabaseResult = import("mysql2/promise").ResultSetHeader;
type DatabaseResultRow<T> = import("mysql2/promise").RowDataPacket & T;
