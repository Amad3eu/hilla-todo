import type Todo from 'Frontend/generated/com/example/application/Todo';
import { useEffect, useState } from 'react';
import { FormikErrors, useFormik } from 'formik';
import { Button } from '@hilla/react-components/Button.js';
import { Checkbox } from '@hilla/react-components/Checkbox.js';
import { TextField } from '@hilla/react-components/TextField.js';
import { TodoEndpoint } from 'Frontend/generated/endpoints';
import { EndpointValidationError } from '@hilla/frontend';

export default function TodoView() {
  const empty: Todo = { task: '', done: false };
  const [todos, setTodos] = useState(Array<Todo>());

  useEffect(() => {
    (async () => {
      setTodos(await TodoEndpoint.findAll());
    })();

    return () => {};
  }, []);

  const formik = useFormik({
    initialValues: empty,
    onSubmit: async (value: Todo, { setSubmitting, setErrors }) => {
      try {
        const saved = (await TodoEndpoint.save(value)) ?? value;
        setTodos([...todos, saved]);
        formik.resetForm();
      } catch (e: unknown) {
        if (e instanceof EndpointValidationError) {
          const errors: FormikErrors<Todo> = {};
          for (const error of e.validationErrorData) {
            if (typeof error.parameterName === 'string' && error.parameterName in empty) {
              const key = error.parameterName as string & keyof Todo;
              errors[key] = error.message;
            }
          }
          setErrors(errors);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  async function changeStatus(todo: Todo, done: boolean) {
    const newTodo = { ...todo, done: done };
    const saved = (await TodoEndpoint.save(newTodo)) ?? newTodo;
    setTodos(todos.map((item) => (item.id === todo.id ? saved : item)));
  }

  return (
    <>
      <div className="m-m flex items-baseline gap-m">
        <TextField
          name="task"
          label="Task"
          value={formik.values.task}
          onChange={formik.handleChange}
          onBlur={formik.handleChange}
        />
        <Button theme="primary" disabled={formik.isSubmitting} onClick={formik.submitForm}>
          Add
        </Button>
      </div>

      <div className="m-m flex flex-col items-stretch gap-s">
        {todos.map((todo) => (
          <Checkbox
            key={todo.id}
            checked={todo.done}
            onCheckedChanged={({ detail: { value } }) => changeStatus(todo, value)}
          >
            {todo.task}
          </Checkbox>
        ))}
      </div>
    </>
  );
}
