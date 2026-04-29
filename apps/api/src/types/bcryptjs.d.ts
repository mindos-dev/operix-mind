declare module 'bcryptjs' {
  const bcrypt: {
    compareSync(data: string, encrypted: string): boolean;
    genSaltSync(rounds?: number): string;
    hashSync(data: string, salt?: string | number): string;
  };

  export default bcrypt;
}
