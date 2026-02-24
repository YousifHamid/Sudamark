import bcrypt from 'bcryptjs';
async function test() {
    const isMatch = await bcrypt.compare('SM@11223344', '$2b$10$PMHGi/N2IQrt3EaX/0cFxuYKXGbyQbvDFUmBxztMZ5MW0h2hC2SfW');
    console.log({ isMatch });
}
test();
