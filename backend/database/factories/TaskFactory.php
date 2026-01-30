<?php

namespace Database\Factories;

use App\Enums\TaskStatusEnum;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->boolean(65) ? fake()->paragraph() : null,
            'status' => fake()->randomElement(array_map(fn (TaskStatusEnum $c) => $c->value, TaskStatusEnum::cases())),
            'user_id' => User::factory(),
        ];
    }
}
