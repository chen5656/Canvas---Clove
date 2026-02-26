db design has problem.

so it has recipes and recipe_translations. while the recipe doesn't need to be in english, it can be in any language. also, in this case, user may have english recipe and chinese recipe, then decided to remove english/chinese recipe. Also, user may just have chinese recipe from begin to end. the current design doesn't support this well. also, ingredients, if you don't translate ingredients, then the translation will be useless. 

remove Ingredient vocabulary , don't need tag for it. 

collection_shares, we don't do share for now. We will discuss and consider share later.

Important: don't implement any feature yet.