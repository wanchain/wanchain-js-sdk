var bb = [1, 2, 4].reduce((total, item) => {
     let a = item + 'a';
    return total + a;
});
console.log(bb)